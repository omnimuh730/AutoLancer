// core/analyze.js
const { matchesSubmitKeyword } = require('./submitDetector');
const { checkIfThisElementIsUnnecessary } = require('./unnecessaryDetector');
const { identifyFieldIntent, getMeaningfulContext } = require('./staticfieldDetector');
const { classifyInteractionType } = require('./elementClassifier');
const { getProfileValue } = require('./getFunctionCalling');
const { generateDynamicAnswer, generateSelectionAnswer } = require('./aiService'); // <--- Import New Function

function getSelectOptionsFromChildren(children) {
	const selectChild = children.find((c) => c?.tag === 'select');
	if (!selectChild) return [];

	if (Array.isArray(selectChild.options) && selectChild.options.length) {
		return selectChild.options
			.map((o) => (o?.text || '').trim())
			.filter((t) => t.length > 0);
	}

	const html = selectChild.outerHTML || '';
	if (!html.includes('<option')) return [];
	const matches = Array.from(html.matchAll(/<option[^>]*>([^<]*)<\/option>/gi));
	return matches.map((m) => (m[1] || '').trim()).filter(Boolean);
}

function getSelectChildIndex(children) {
	return children.findIndex((c) => c?.tag === 'select');
}

function getComboboxChildIndex(children) {
	if (!Array.isArray(children) || children.length === 0) return -1;
	const idx = children.findIndex((c) => String(c?.properties?.role || '').toLowerCase() === 'combobox');
	if (idx !== -1) return idx;
	return children.findIndex((c) => String(c?.properties?.['aria-haspopup'] || '').toLowerCase() === 'true');
}

function pickLocalUploadIndex(children) {
	const normalized = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
	const texts = children.map((c) => normalized(c?.innerText || c?.properties?.['aria-label'] || '')).filter(Boolean);
	const enterIdx = texts.findIndex((t) => t.includes('enter manually'));
	if (enterIdx !== -1) return enterIdx;
	const uploadIdx = texts.findIndex((t) => t.includes('upload'));
	if (uploadIdx !== -1) return uploadIdx;
	return -1;
}

function getDefaultUploadPath(fieldKey) {
	if (fieldKey === 'resume') return 'D:\\Job Hunting\\Profiles\\Bi Ge\\Resume\\AI\\Bi Ge.pdf';
	if (fieldKey === 'coverletter') return 'D:\\Job Hunting\\Profiles\\Bi Ge\\Resume\\Cover Letter.pdf';
	return null;
}

function findUploadTriggerIndex(children) {
	if (!Array.isArray(children) || children.length === 0) return -1;
	const norm = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
	// Prefer explicit "upload"/"attach" CTAs
	for (let i = 0; i < children.length; i++) {
		const c = children[i];
		if (!c) continue;
		if (!['button', 'a', 'label', 'div', 'span', 'input'].includes(String(c.tag || '').toLowerCase())) continue;
		const text = norm(c.innerText || '') + ' ' + norm(c.properties?.['aria-label'] || '') + ' ' + norm(c.properties?.title || '');
		if (text.includes('upload') || text.includes('attach') || text.includes('choose file') || text.includes('browse')) return i;
	}
	// Fallback: first button/label
	const btnIdx = children.findIndex((c) => ['button', 'label', 'a'].includes(String(c?.tag || '').toLowerCase()));
	if (btnIdx !== -1) return btnIdx;
	return -1;
}

async function analyzeData(data, options = {}) {
	const children = data.Children || [];
	const parent = data.Parent;
	let aiUsageStats = null;
	const jobDescription = options?.jobDescription || '';
	const profileIdentifier = options?.profileIdentifier || '';

	// 1. Submit Detection
	if (children.length === 1 && matchesSubmitKeyword(children[0])) {
		return {
			summary: 'Submit Application button detected.',
			action_suggestion: {
				command: 'MANUAL_INTERVENTION',
				payload: {
					childIndex: 0,
					text: children[0].innerText,
					message: 'Submit/Apply/Next detected. Please review the form and click manually.'
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
		// Avoid clicking third-party upload provider buttons (Dropbox/Google Drive/Enter manually).
		// Real uploads are handled via explicit UPLOAD fields (resume/cover letter) when a file input exists.
		if (intent.field === 'file_upload') {
			return {
				summary: `Analyzed: ${intent.field} (SKIPPED)`,
				insights: {
					field: intent.field,
					interactionType: interactionType,
					context: context
				},
				action_suggestion: null,
				aiUsage: null
			};
		}

		// --- STATIC FIELD LOGIC (Existing) ---
		const profileValue = getProfileValue(intent.field, { profileIdentifier });

		if (interactionType === 'UPLOAD') {
			const fileIndex = children.findIndex(c => c.tag === 'input' && String(c?.properties?.type || '').toLowerCase() === 'file');
			const fallbackIndex = findUploadTriggerIndex(children);
			const inputIndex = fileIndex !== -1
				? fileIndex
				: (fallbackIndex !== -1 ? fallbackIndex : (children.findIndex(c => c.tag === 'input')));
			const value = profileValue || getDefaultUploadPath(intent.field);
			finalAction = {
				command: "UPLOAD",
				payload: { value, childIndex: inputIndex, field: intent.field }
			};
		}
		else if (interactionType === 'TYPING') {
			const inputIndex = children.findIndex(c => c.tag === 'input' || c.tag === 'textarea');
			const value = intent.field === 'coverletter'
				? (getProfileValue('coverletter_text', { profileIdentifier }) || 'This is cover letter')
				: profileValue;
			finalAction = {
				command: "TYPING",
				payload: { value, childIndex: inputIndex }
			};
		}
		else if (interactionType === 'COMBOBOX') {
			const comboboxIndex = getComboboxChildIndex(children);
			const selectionValue = profileValue;
			if (selectionValue) {
				finalAction = {
					command: "SELECT_OPTION",
					payload: { childIndex: comboboxIndex !== -1 ? comboboxIndex : 0, selectionValue }
				};
			} else {
				finalAction = { command: "ERROR", reason: `No profile value for '${intent.field}'` };
			}
		}
		else if (interactionType === 'SELECT') {
			const optionsList = getSelectOptionsFromChildren(children);
			const selectChildIndex = getSelectChildIndex(children);
			if (profileValue) {
				const desired = String(profileValue).toLowerCase().trim();
				const matched = optionsList.find((opt) => String(opt).toLowerCase().trim() === desired)
					|| optionsList.find((opt) => String(opt).toLowerCase().includes(desired));
				if (matched) {
					const selectedIndex = Math.max(0, optionsList.findIndex((opt) => opt === matched));
					finalAction = {
						command: "SELECT_OPTION",
						payload: { childIndex: selectChildIndex, selectedIndex, selectionValue: matched }
					};
				} else if (optionsList.length > 0) {
					const aiResponse = await generateSelectionAnswer(context, optionsList, { jobDescription, profileIdentifier });
					aiUsageStats = aiResponse.usage;
					finalAction = {
						command: "SELECT_OPTION",
						payload: { childIndex: selectChildIndex, selectedIndex: aiResponse.selectedIndex, selectionValue: optionsList[aiResponse.selectedIndex] }
					};
				} else {
					finalAction = { command: "ERROR", reason: `No options found for '${intent.field}'` };
				}
			} else if (optionsList.length > 0) {
				const aiResponse = await generateSelectionAnswer(context, optionsList, { jobDescription, profileIdentifier });
				aiUsageStats = aiResponse.usage;
				finalAction = {
					command: "SELECT_OPTION",
					payload: { childIndex: selectChildIndex, selectedIndex: aiResponse.selectedIndex, selectionValue: optionsList[aiResponse.selectedIndex] }
				};
			} else {
				finalAction = { command: "ERROR", reason: `No profile value for '${intent.field}'` };
			}
		}
		else if (interactionType === 'SELECTION_GROUP') {
			const optionsList = children.map(c => (c.innerText || '').trim()).filter(t => t.length > 0);

			// Prefer local uploads for the "attach/upload" chooser widgets (e.g., Greenhouse: Dropbox/Google Drive/Enter manually).
			if (intent.field === 'file_upload') {
				const preferredIndex = pickLocalUploadIndex(children);
				if (preferredIndex !== -1) {
					finalAction = {
						command: "CLICK",
						payload: { childIndex: preferredIndex, text: children[preferredIndex]?.innerText || '' }
					};
					return {
						summary: `Analyzed: ${intent.field || 'Dynamic Question'} (${interactionType})`,
						insights: {
							field: intent.field,
							interactionType: interactionType,
							context: context
						},
						action_suggestion: finalAction,
						aiUsage: aiUsageStats
					};
				}
			}

			if (profileValue) {
				const targetIndex = children.findIndex(child => {
					const text = (child.innerText || '').toLowerCase().trim();
					const value = String(profileValue).toLowerCase().trim();
					return text === value;
				});

				if (targetIndex !== -1) {
					finalAction = {
						command: "CLICK",
						payload: { childIndex: targetIndex, text: children[targetIndex].innerText }
					};
				} else if (optionsList.length > 0) {
					const aiResponse = await generateSelectionAnswer(context, optionsList, { jobDescription, profileIdentifier });
					aiUsageStats = aiResponse.usage;
					finalAction = {
						command: "CLICK",
						payload: {
							childIndex: aiResponse.selectedIndex,
							text: optionsList[aiResponse.selectedIndex],
							reasoning: aiResponse.reasoning
						}
					};
				} else {
					finalAction = { command: "ERROR", reason: `Static option '${profileValue}' not found.` };
				}
			} else if (optionsList.length > 0) {
				const aiResponse = await generateSelectionAnswer(context, optionsList, { jobDescription, profileIdentifier });
				aiUsageStats = aiResponse.usage;
				finalAction = {
					command: "CLICK",
					payload: {
						childIndex: aiResponse.selectedIndex,
						text: optionsList[aiResponse.selectedIndex],
						reasoning: aiResponse.reasoning
					}
				};
			} else {
				finalAction = { command: "ERROR", reason: `No profile value for '${intent.field}'` };
			}
		}
	} else {
		// --- DYNAMIC AI LOGIC (Updated) ---

		// If it's a text input or textarea but NOT a known static field (like Name/Email/CoverLetter)
		// It is likely a question like "Why do you want to work here?" or "Describe a challenge."
		if (interactionType === 'TYPING') {

			// 1. Call AI Service
			const inputIndex = children.findIndex(c => c.tag === 'input' || c.tag === 'textarea');
			const isTextarea = children?.[inputIndex]?.tag === 'textarea';
			const aiResponse = await generateDynamicAnswer(context, { jobDescription, profileIdentifier, refine: isTextarea });
			aiUsageStats = aiResponse.usage;

			// 2. Find the input element
			finalAction = {
				command: "TYPING",
				payload: {
					value: aiResponse.answer, // The text generated by OpenAI
					childIndex: inputIndex
				}
			};
		}
		// Case B: Dynamic Selection (e.g. "Do you have 5+ years of React?", "Are you willing to relocate?")
		// Handles: Radio Groups, Checkbox Groups, Native Selects, Comboboxes (if treated as selection)
		else if (['SELECTION_GROUP', 'SELECT', 'COMBOBOX'].includes(interactionType)) {

			// 1. Extract Options from Children
			// We strip clean the text for the AI to read
			const optionsList = interactionType === 'SELECT'
				? getSelectOptionsFromChildren(children)
				: children.map(c => (c.innerText || '').trim()).filter(t => t.length > 0);

			if (optionsList.length > 0) {
				// 2. Call AI Selection Service
				const aiResponse = await generateSelectionAnswer(context, optionsList, { jobDescription, profileIdentifier });
				aiUsageStats = aiResponse.usage;

				// 3. Construct Action based on Interaction Type
				if (interactionType === 'SELECTION_GROUP') {
					// For radios/buttons, we CLICK the specific child
					finalAction = {
						command: "CLICK",
						payload: {
							childIndex: aiResponse.selectedIndex,
							text: optionsList[aiResponse.selectedIndex],
							reasoning: aiResponse.reasoning
						}
					};
				} else if (interactionType === 'SELECT') {
					// For native <select>, we usually SELECT by value or text
					const selectChildIndex = getSelectChildIndex(children);
					finalAction = {
						command: "SELECT_OPTION",
						payload: {
							childIndex: selectChildIndex,
							selectedIndex: aiResponse.selectedIndex,
							selectionValue: optionsList[aiResponse.selectedIndex]
						}
					};
				} else if (interactionType === 'COMBOBOX') {
					// For comboboxes, prefer selection-mode so the extension can open and click list items (e.g., React-Select).
					finalAction = {
						command: "SELECT_OPTION",
						payload: {
							childIndex: getComboboxChildIndex(children) !== -1 ? getComboboxChildIndex(children) : 0,
							selectedIndex: aiResponse.selectedIndex,
							selectionValue: optionsList[aiResponse.selectedIndex]
						}
					};
				}
			} else {
				finalAction = { command: "ERROR", reason: "Dynamic Selection: No options found in children." };
			}
		}
		else if (interactionType !== 'UNKNOWN') {
			return {
				summary: 'Complex dynamic field detected (Non-text).',
				question: context,
				action_suggestion: {
					command: "MANUAL_INTERVENTION",
					payload: { message: "Cannot automate this interaction type via AI yet." }
				}
			};
		}
	}

	return {
		summary: `Analyzed: ${intent.field || 'Dynamic Question'} (${interactionType})`,
		insights: {
			field: intent.field,
			interactionType: interactionType,
			context: context
		},
		action_suggestion: finalAction,
		aiUsage: aiUsageStats
	};
}

module.exports = { analyzeData };
