// core/analyze.js
const { matchesSubmitKeyword } = require('./submitDetector');
const { checkIfThisElementIsUnnecessary } = require('./unnecessaryDetector');
const { identifyFieldIntent, getMeaningfulContext } = require('./staticfieldDetector');
const { classifyInteractionType } = require('./elementClassifier');
const { getProfileValue } = require('./getFunctionCalling');

async function analyzeData(data) {
	const children = data.Children || [];
	const parent = data.Parent;

	// 1. Submit Detection
	if (children.length === 1 && matchesSubmitKeyword(children[0])) {
		return {
			summary: 'Submit Application button detected.',
			action_suggestion: {
				command: 'CLICK',
				payload: {
					childIndex: 0, // It's the only child
					text: children[0].innerText
				}
			}
		};
	}

	// 2. Unnecessary Detection
	if (checkIfThisElementIsUnnecessary(parent, children)) {
		return { summary: 'Unnecessary element detected.', action_suggestion: null };
	}

	// 3. Classify Interaction Type
	const interactionType = classifyInteractionType(children);

	// 4. Identify Context
	const context = getMeaningfulContext(parent, children);
	const intent = identifyFieldIntent(context);

	let finalAction = null;

	// 5. Logic Engine
	if (intent.isStatic) {
		const profileValue = getProfileValue(intent.field);

		// --- UPLOAD ---
		if (interactionType === 'UPLOAD') {
			const inputIndex = children.findIndex(c => c.tag === 'input');
			finalAction = {
				command: "UPLOAD",
				payload: {
					value: profileValue,
					childIndex: inputIndex // Pass index instead of selector
				}
			};
		}
		// --- TYPING / COMBOBOX ---
		else if (interactionType === 'TYPING' || interactionType === 'COMBOBOX') {
			// Find the index of the specific input field within the children array
			const inputIndex = children.findIndex(c => c.tag === 'input' || c.tag === 'textarea');
			finalAction = {
				command: "TYPING",
				payload: {
					value: profileValue,
					childIndex: inputIndex
				}
			};
		}
		// --- SELECTION (RADIOS / BUTTONS) ---
		else if (interactionType === 'SELECTION_GROUP') {
			if (profileValue) {
				// Find index of child where innerText matches profile value (case-insensitive)
				const targetIndex = children.findIndex(child => {
					const text = (child.innerText || '').toLowerCase().trim();
					const value = profileValue.toLowerCase().trim();
					return text === value;
				});

				if (targetIndex !== -1) {
					finalAction = {
						command: "CLICK",
						payload: {
							// THIS IS THE FIX:
							// We return the specific index in the children array.
							// The frontend can now access component.children[childIndex].click()
							childIndex: targetIndex,
							text: children[targetIndex].innerText
						}
					};
				} else {
					finalAction = { command: "ERROR", reason: `Option '${profileValue}' not found in group.` };
				}
			} else {
				finalAction = { command: "ERROR", reason: `No profile value found for '${intent.field}'` };
			}
		}
	} else {
		// Fallback for Dynamic Questions
		if (interactionType !== 'UNKNOWN') {
			return {
				summary: 'Dynamic question detected.',
				question: context,
				action_suggestion: {
					command: "AI_GENERATION",
					payload: { message: "This requires Ai's response" }
				}
			};
		}
	}

	return {
		summary: `Analyzed: ${intent.field || 'Unknown'} (${interactionType})`,
		insights: {
			field: intent.field,
			interactionType: interactionType,
			context: context
		},
		action_suggestion: finalAction
	};
}

module.exports = { analyzeData };