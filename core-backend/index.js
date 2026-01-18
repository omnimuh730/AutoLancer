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

	analyzeResultSet = [];
	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	console.log('Analyze endpoint processing started');

	for (const component of analyzeComponentData.components) {
		const analyzeResult = await analyzeData(component);

		// Accumulate Tokens
		if (analyzeResult.aiUsage) {
			totalInputTokens += analyzeResult.aiUsage.prompt_tokens || 0;
			totalOutputTokens += analyzeResult.aiUsage.completion_tokens || 0;
		}

		analyzeResultSet.push({
			...analyzeResult
		});
	}

	// Pricing Calculation (Per 1M tokens)
	const PRICE_PER_1M_INPUT = 0.05;
	const PRICE_PER_1M_OUTPUT = 0.40;

	const inputCost = (totalInputTokens / 1000000) * PRICE_PER_1M_INPUT;
	const outputCost = (totalOutputTokens / 1000000) * PRICE_PER_1M_OUTPUT;
	const totalCost = inputCost + outputCost;

	console.log('Analyze endpoint processing complete');

	// Log the cost analysis
	if (totalInputTokens > 0 || totalOutputTokens > 0) {
		console.log(`--------------------------------------------------`);
		console.log(`AI Cost Analysis:`);
		console.log(`Input Tokens:  ${totalInputTokens}`);
		console.log(`Output Tokens: ${totalOutputTokens}`);
		console.log(`Total Price:   $${totalCost.toFixed(8)}`); // High precision for micro-costs
		console.log(`--------------------------------------------------`);
	}

	return res.json({ message: 'Analyze endpoint received data successfully', payload: analyzeResultSet });
});

app.listen(port, process.env.HOST || 'localhost', () => {
	console.log(`Server running on http://${process.env.HOST || 'localhost'}:${port}`);
});