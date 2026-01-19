// core/aiService.js
const OpenAI = require('openai');
//const { getFullUserProfile } = require('./profileLoader');

// Initialize OpenAI (Make sure OPENAI_API_KEY is in your .env)
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const getFullUserProfile = () => {
	return `
**Your Details:**
    - **Name:** Terry Huang
	- **Location:** Gladewater, TX
	- **Education:** Bachelor of Science at Texas A&M University
	- **Company Career**
		- Senior Software Engineer | Airbnb | Apr 2022 - Present
		- Software Engineer | Amazon | Nov 2018 - Apr 2022
		- Full Stack Developer | Tango, Health, Inc. | Mar 2016 - Nov 2018
	- **Option Considerations:**
		- Not veteran, no military experience
		- Not willing to relocate
		- Only looking forward remote work, not able to commute to office
		- Gender: Male
		- Sexual preference: Heterosexual
		- Race: East Asian or Asian
		- Age: 34 yrs
		- Nationality: American
`
}

const getSystemSetting = () => {
	return `
	 ### Rules for your Responses:

	1. **Style:**
		- Use creative phrasing, natural and respectful tone.
		- Avoid repetitive or cliché words like *"cutting-edge"* or *"throughout my career."*
		- Keep sentences sharp, professional, and polished—in practically detail.
	2. **Content:**
		- Focus on practical, real-world experience with advanced technical insight.
		- Tie answers directly to industry-specific practices.
		- Anticipate the recruiter’s intent and align responses accordingly.
	3. **Prohibited Responses:**
		- Avoid saying you have little or no experience.
		- Don’t provide code in answers.
		- Never format answers as bullets.
	4. **Goal:**
		- Impress through clarity, expertise, and relevance.
		- Always answer concisely and directly to what is asked—no unnecessary elaboration.

	---

	You will provide tailored, impactful responses for the best hiring impression. Always think about what the recruiter wants to hear.

	Always keep human's natural speaking tone and easy words to understand like Steven Job's speaking style.

	Answer should be technicall very detail by mentioning complex professional glossaries, not well-known glossaries with detailed real scenario.

	Tone should be the most natural, the closest tone of human's normal speaking tone.

	Ideal length of response is 2-3 sentences - shortly.
    
    ### Interview Roleplay Instructions

	You are my interview supporter. I will act as the interviewer (manager), and you will act as the interviewee.
	`;
}

// Helper to sum usage objects
function sumUsage(u1, u2) {
	return {
		prompt_tokens: (u1?.prompt_tokens || 0) + (u2?.prompt_tokens || 0),
		completion_tokens: (u1?.completion_tokens || 0) + (u2?.completion_tokens || 0),
		total_tokens: (u1?.total_tokens || 0) + (u2?.total_tokens || 0)
	};
}

const REFINEMENT_PROMPT = `
Your answer still sound like AI-made. Please do not use buzzwords like solution, digital, drawn to, journey, pretty, extensively.
Please give me a human-like response with practical, realistic experience, a natural, naive tone, and reasonable reasons.
Please think creatively.
Always use simple words, simple grammar, short sentence style so that can be easily understand.
Answer much more shortly
`;

async function generateDynamicAnswer(questionContext, jobDescription = '') {
	const userProfile = getFullUserProfile();
	const jobContext = jobDescription && String(jobDescription).trim()
		? `\n\n### Job Description Context (optional)\n${String(jobDescription).trim()}\n`
		: '';

	// Construct a prompt that gives the AI the context it needs
	const systemPrompt = `
    ${getSystemSetting()}

	${userProfile}
	${jobContext}
	---
    `;

	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: `Form Question: "${questionContext}"` }
	];

	let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

	try {
		const completion1 = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5-nano-2025-08-07", // or gpt-3.5-turbo
		});


		const draftAnswer = completion1.choices[0].message.content.trim();
		totalUsage = sumUsage(totalUsage, completion1.usage);

		// --- TURN 2: Refinement (The "Chat" Feature) ---
		// We push the assistant's previous answer and our critique into history
		messages.push({ role: "assistant", content: draftAnswer });
		messages.push({ role: "user", content: REFINEMENT_PROMPT });

		const completion2 = await openai.chat.completions.create({
			messages: messages,
			model: "gpt-5-nano-2025-08-07",
		});

		const refinedAnswer = completion2.choices[0].message.content.trim();
		totalUsage = sumUsage(totalUsage, completion2.usage);

		console.log(`[AI Chat] Q: "${questionContext}"\n -> Draft: ${draftAnswer.substring(0, 50)}...\n -> Refined: "${refinedAnswer}"`);

		return {
			answer: refinedAnswer,
			usage: totalUsage
			/*
				Completion usage {
					prompt_tokens: 515,
					completion_tokens: 1940,
					total_tokens: 2455,
					prompt_tokens_details: { 
						cached_tokens: 0, audio_tokens: 0 
					},
					completion_tokens_details: {
						reasoning_tokens: 1856,
						audio_tokens: 0,
						accepted_prediction_tokens: 0,
						rejected_prediction_tokens: 0
					}
				}
				*/
		};

	} catch (error) {
		console.error("AI Generation Error:", error);

		return {
			answer: "Error generating response.",
			usage: { prompt_tokens: 0, completion_tokens: 0 }
		};
	}
}
/**
 * Generates an index-based choice for Radio buttons, Checkboxes, or Dropdowns.
 * @param {string} questionContext - The label/context of the field.
 * @param {string[]} optionsList - Array of text strings representing the available options.
 */
async function generateSelectionAnswer(questionContext, optionsList, jobDescription = '') {
	const userProfile = getFullUserProfile();
	const jobContext = jobDescription && String(jobDescription).trim()
		? `\n\n### Job Description Context (optional)\n${String(jobDescription).trim()}\n`
		: '';

	const systemPrompt = `
    ${getSystemSetting()}

	${userProfile}
	${jobContext}

    Task:
    You will be given a form question and a list of possible options.
    Select the option that best matches the candidate's profile.
    
    Output Format:
    Return a strict JSON object: { "selectedIndex": <integer>, "reasoning": "<string>" }
    - "selectedIndex": The array index (0-based) of the chosen option.
    - If no option fits perfectly, choose the most logical one (e.g., "No" for negative questions).
    `;

	const userMessage = `
    Question: "${questionContext}"
    Options: ${JSON.stringify(optionsList)}
    
    Which index should I select?
    `;

	try {
		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userMessage }
			],
			model: "gpt-5-nano-2025-08-07", // Your preferred model
			response_format: { type: "json_object" }, // Enforce JSON
		});

		const content = completion.choices[0].message.content;
		const parsed = JSON.parse(content);

		console.log(`[AI Selection] Q: "${questionContext}" | Options: [${optionsList}] -> Selected: [${parsed.selectedIndex}] (${optionsList[parsed.selectedIndex]})`);

		return {
			selectedIndex: parsed.selectedIndex,
			reasoning: parsed.reasoning,
			usage: completion.usage
		};

	} catch (error) {
		console.error("AI Selection Generation Error:", error);
		// Fallback: Default to first option if AI fails
		return {
			selectedIndex: 0,
			reasoning: "Error fallback",
			usage: { prompt_tokens: 0, completion_tokens: 0 }
		};
	}
}

module.exports = { generateDynamicAnswer, generateSelectionAnswer };
