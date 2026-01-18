// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const { analyzeData } = require('./core/analyze');

const app = express();
const port = process.env.PORT || 3001;

const REQUEST_LIMIT_PER_SECOND = 10;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for potentially larger schemas

// Simple bridge to MCP profile data so the Agent can fetch it
app.get('/profile', (req, res) => {
	try {
		const profilePath = path.resolve(__dirname, '..', 'mcp-profile-server', 'src', 'data', 'profile.json');
		const content = fs.readFileSync(profilePath, 'utf8');
		res.setHeader('Content-Type', 'application/json');
		res.send(content);
	} catch (e) {
		console.error('Failed to load profile data from MCP server folder', e);
		res.status(500).send('Failed to load profile data');
	}
});

// Helper: Pause execution for X milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * PROCESS WITH RATE LIMIT
 * Starts requests in parallel but staggers their start times to respect API limits.
 * 
 * @param {Array} items - The list of components to analyze
 * @param {Function} workerFn - The async function to call for each item
 * @param {Number} reqPerSecond - Max requests to start per second (default REQUEST_LIMIT_PER_SECOND)
 */
async function processWithRateLimit(items, workerFn, reqPerSecond = REQUEST_LIMIT_PER_SECOND) {
	const results = new Array(items.length); // Pre-allocate to ensure order
	const delayBetweenRequests = 1000 / reqPerSecond; // e.g., 200ms

	// Create an array of promises that start with a delay
	const promises = items.map((item, index) => {
		return new Promise(async (resolve) => {
			// 1. Stagger the start time
			// Item 0 waits 0ms, Item 1 waits 200ms, Item 2 waits 400ms...
			await wait(index * delayBetweenRequests);

			// 2. Execute the worker (Async)
			// We don't await this inside the map so the loop continues immediately
			try {
				// console.log(`[Index ${index}] Starting analysis...`);
				const result = await workerFn(item);
				results[index] = result; // Store result in the specific index to preserve order
			} catch (err) {
				console.error(`[Index ${index}] Error processing:`, err);
				results[index] = {
					summary: "Error during processing",
					error: err.message,
					action_suggestion: null
				};
			}
			resolve(); // Mark this promise as "launched and completed"
		});
	});

	// 3. Wait for ALL logic to complete
	await Promise.all(promises);
	return results;
}

// --- MCP client (lazy) ---
let mcpClient = null;
let mcpTransport = null;
async function ensureMcp() {
	if (mcpClient) return mcpClient;
	const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
	const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
	const serverPath = path.resolve(__dirname, '..', 'mcp-profile-server', 'src', 'index.js');
	mcpTransport = new StdioClientTransport({
		command: process.execPath, // node
		args: [serverPath],
		cwd: path.resolve(__dirname, '..', 'mcp-profile-server')
	});
	mcpClient = new Client({ name: 'spirit-backend', version: '1.0.0' });
	await mcpClient.connect(mcpTransport);
	return mcpClient;
}

// POST /resume { jobDescription }
app.post('/resume', async (req, res) => {
	try {
		const jobDescription = req.body?.jobDescription || '';
		const client = await ensureMcp();
		const result = await client.callTool({ name: 'resumeForJobDescription', arguments: { jobDescription } });
		const out = result.structuredContent || {};
		res.json(out);
	} catch (e) {
		console.error('Error calling MCP resume tool', e);
		// Fallback to default
		res.json({
			profile: 'Python + React',
			resumePath: 'D:\\Job Hunting\\Profiles\\Bryan Reyes\\Python + React\\Bryan Reyes.pdf',
			coverLetterPath: 'D:\\Job Hunting\\Profiles\\Bryan Reyes\\Cover Letter.pdf',
			basedOn: 'fallback'
		});
	}
});

// POST /qa { question }
app.post('/qa', async (req, res) => {
	try {
		const question = req.body?.question || '';
		const client = await ensureMcp();
		const result = await client.callTool({ name: 'normalQuestionAnswer', arguments: { question } });
		const out = result.structuredContent || { answer: '' };
		res.json(out);
	} catch (e) {
		console.error('Error calling MCP QA tool', e);
		res.json({ answer: 'Answer is not prepared yet.' });
	}
});

app.post('/analyze', async (req, res) => {
	const payload = req.body.userInput || null;

	if (!payload) {
		return res.status(400).json({ error: 'Missing userInput in request body' });
	}

	const analyzeComponentData = JSON.parse(payload);
	//	console.log(analyzeComponentData);

	// --- 1. START TIMER ---
	const startTime = Date.now();
	console.log(`\n=== Analyze Batch Started: ${analyzeComponentData.components.length} Items ===`);

	let totalInputTokens = 0;
	let totalOutputTokens = 0;

	// --- 2. DEFINE WORKER ---
	const worker = async (component) => {
		const result = await analyzeData(component);

		// Accumulate cost metrics safely
		if (result.aiUsage) {
			totalInputTokens += (result.aiUsage.prompt_tokens || 0);
			totalOutputTokens += (result.aiUsage.completion_tokens || 0);
		}
		return result;
	};

	// --- 3. EXECUTE WITH RATE LIMIT ---
	// 5 requests per second = starts a new request every 200ms
	const analyzeResultSet = await processWithRateLimit(
		analyzeComponentData.components,
		worker,
		5
	);

	// --- 4. END TIMER & CALCULATE COST ---
	const endTime = Date.now();
	const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

	// Pricing (Example: GPT-4o-mini)
	// Input: $0.15 / 1M tokens | Output: $0.60 / 1M tokens (Adjust as needed)
	const PRICE_PER_1M_INPUT = 0.15;
	const PRICE_PER_1M_OUTPUT = 0.60;

	const inputCost = (totalInputTokens / 1000000) * PRICE_PER_1M_INPUT;
	const outputCost = (totalOutputTokens / 1000000) * PRICE_PER_1M_OUTPUT;
	const totalCost = inputCost + outputCost;

	console.log(`=== Analyze Batch Complete ===`);
	console.log(`Time Taken:    ${durationSeconds}s`);
	console.log(`Requests:      ${analyzeComponentData.components.length}`);
	console.log(`Tokens Used:   ${totalInputTokens} (In) / ${totalOutputTokens} (Out)`);
	console.log(`Est. Cost:     $${totalCost.toFixed(6)}`);
	console.log(`==============================\n`);

	return res.json({
		message: 'Analyze endpoint received data successfully',
		payload: analyzeResultSet,
		meta: {
			performance: {
				durationSeconds: durationSeconds,
				requestsPerSecondConfig: REQUEST_LIMIT_PER_SECOND
			},
			cost: {
				inputTokens: totalInputTokens,
				outputTokens: totalOutputTokens,
				estimatedPriceUSD: totalCost
			}
		}
	});
});

app.listen(port, process.env.HOST || 'localhost', () => {
	console.log(`Server running on http://${process.env.HOST || 'localhost'}:${port}`);
});