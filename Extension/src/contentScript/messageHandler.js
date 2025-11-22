import { findLowestCommonAncestor, findElements, waitForElements } from "./elementFinder";
import { isVisible } from "./domUtils";
import { clearHighlights, highlightByPattern as doHighlightByPattern } from "./highlighter";
import { performActionOnElement } from "./actionExecutor";

// --- HELPER FUNCTIONS ---

/**
 * Normalizes text by trimming and collapsing all internal whitespace to a single space.
 * This makes string comparisons much more reliable.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
	if (!text) return '';
	return text.trim().replace(/\s+/g, ' ');
}

/**
 * (This helper is from the previous version, it remains correct)
 * Finds the meaningful "control group" for an input like a checkbox or radio.
 * @param {HTMLInputElement} inputEl The input element.
 * @returns {HTMLElement} The label element or the original input.
 */
function findControlGroupForInput(inputEl) {
	if (inputEl.innerText.trim() !== '') return inputEl;
	if (inputEl.id) {
		const label = document.querySelector(`label[for="${inputEl.id}"]`);
		if (label) return label;
	}
	const parentLabel = inputEl.closest('label');
	if (parentLabel) return parentLabel;
	return inputEl;
}


// --- THE NEW, ROBUST PARENT FINDER ---

/**
 * Travels up the DOM tree to find the smallest ancestor that contains meaningful
 * text content beyond just the starting node's own text.
 * @param {HTMLElement} startNode The red-highlighted element/group.
 * @returns {HTMLElement} The meaningful parent component.
 */
function findMeaningfulParent(startNode) {
	const startNodeText = normalizeText(startNode.innerText);
	let currentParent = startNode.parentElement;

	// Loop upwards until we hit the top of the document.
	while (currentParent) {
		// Stop if we hit a major structural boundary. This is a safeguard.
		const tagName = currentParent.tagName.toUpperCase();
		if (['FORM', 'FIELDSET', 'MAIN', 'BODY'].includes(tagName)) {
			break;
		}

		const parentText = normalizeText(currentParent.innerText);

		// THE CORE LOGIC:
		// If the parent's text is different from the child's, we've found
		// the component boundary.
		if (parentText !== startNodeText) {
			return currentParent;
		}

		// Otherwise, the parent is just a simple wrapper, so we continue climbing.
		currentParent = currentParent.parentElement;
	}

	// If the loop finishes (e.g., we hit a safeguard), return the last valid parent.
	return currentParent || startNode.parentElement || document.body;
}

/**
 * Serializes an HTMLElement into a structured object containing its tag and key properties.
 * @param {HTMLElement} element The element to serialize.
 * @returns {Object|null} A structured object or null if the element is invalid.
 */
function serializeElement(element) {
	if (!element || typeof element.tagName !== 'string') {
		return null;
	}

	const properties = [];
	// Efficiently add id and class if they exist
	if (element.id) {
		properties.push({ name: 'id', value: element.id });
	}
	if (element.className) {
		properties.push({ name: 'class', value: element.className });
	}

	// Add all data-* attributes
	for (const attr of element.attributes) {
		if (attr.name.startsWith('data-')) {
			properties.push({ name: attr.name, value: attr.value });
		}
	}

	return {
		tag: element.tagName.toLowerCase(),
		properties: properties,
	};
}


/**
 * Groups red-highlighted nodes, highlights parents, and returns the structured data.
 */
function groupAndHighlightComponents() {
	// ... PHASE 1 and PHASE 2 remain exactly the same ...
	const highlightedNodes = document.querySelectorAll('[data-highlighter-outline]');
	const parentChildMap = new Map();
	const processedChildren = new Set();
	const specialButtonTexts = ['submit', 'next', 'apply'];

	const fieldsets = document.querySelectorAll('fieldset');
	for (const fieldset of fieldsets) {
		const childrenInFieldset = Array.from(fieldset.querySelectorAll('[data-highlighter-outline]'));
		if (childrenInFieldset.length > 0) {
			parentChildMap.set(fieldset, childrenInFieldset);
			for (const child of childrenInFieldset) {
				processedChildren.add(child);
			}
		}
	}

	for (const node of highlightedNodes) {
		if (processedChildren.has(node)) continue;
		let parentComponent;
		const nodeText = normalizeText(node.innerText).toLowerCase();
		if (node.tagName === 'BUTTON' && specialButtonTexts.includes(nodeText)) {
			parentComponent = node;
		} else {
			parentComponent = findMeaningfulParent(node);
		}
		if (!parentChildMap.has(parentComponent)) {
			parentChildMap.set(parentComponent, []);
		}
		parentChildMap.get(parentComponent).push(node);
	}


	// --- PHASE 3: MODIFIED to use the new serializer ---
	const resultData = [];
	for (const [parent, children] of parentChildMap.entries()) {
		// Highlighting logic is unchanged
		if (parent.hasAttribute('data-highlighter-outline')) {
			parent.style.outline = '4px solid limegreen';
			parent.style.outlineOffset = '2px';
		} else {
			parent.style.outline = '3px solid green';
			parent.style.outlineOffset = '2px';
		}
		parent.setAttribute('data-highlighter-parent', 'true');

		// *** THIS IS THE CHANGED PART ***
		// Instead of outerHTML, we now call serializeElement.
		resultData.push({
			Parent: serializeElement(parent),
			Children: children.map(serializeElement) // Use .map to serialize each child
		});
	}

	return resultData;
}

export const messageHandler = (request, sender, sendResponse) => {
	(async () => {
		try {
			switch (request.action) {
				case 'EXTRACT_MAIN_CONTENT': {
					// Determine minimal container (LCA) that contains all visible interactables
					const allInteractive = Array.from(document.querySelectorAll('input:not([type="hidden"]),select,textarea,button,[role="button"]')).filter(isVisible);
					let container = allInteractive[0] || document.body;
					if (allInteractive.length > 1) {
						container = findLowestCommonAncestor(allInteractive) || container;
					}
					const mainContent = container.innerText;
					sendResponse && sendResponse({ mainContent });
					break;
				}
				case 'FIND_INTERACTABLE_ELEMENTS': {
					const elements = Array.from(document.querySelectorAll('input, select, textarea, button'));
					const interactableElements = elements.map(element => ({
						tagName: element.tagName,
						type: element.type,
						name: element.name,
						id: element.id,
						placeholder: element.placeholder,
						ariaLabel: element.getAttribute('aria-label'),
					}));
					sendResponse && sendResponse({ interactableElements });
					break;
				}
				case 'highlightByPattern': {
					const { componentType, propertyName, pattern, color } = request.payload || {};
					clearHighlights();
					doHighlightByPattern(componentType || '*', propertyName || 'id', pattern || '', color || 'red');
					break;
				}
				case 'clearHighlight': {
					clearHighlights();
					break;
				}

				case 'executeAction': {
					try {
						const payload = request.payload || {};
						const { action, fetchType, identifier, componentType, propertyName, pattern } = payload;
						if (action === 'fetch') {
							// Resolve target element(s)
							let elements = findElements(componentType, propertyName, pattern);
							if (!elements || elements.length === 0) {
								elements = await waitForElements(componentType, propertyName, pattern, 2000, 100);
							}
							if (!elements || elements.length === 0) {
								chrome.runtime.sendMessage({ action: 'fetchResult', payload: { identifier, success: false, error: 'No elements found' } });
								break;
							}
							const idx = Number.isFinite(payload.order) ? Math.max(0, parseInt(payload.order, 10)) : 0;
							const el = elements[idx];
							let data;
							if (fetchType === 'text') {
								data = el?.innerText ?? '';
							} else {
								// Default: return outerHTML so callers can parse and extract attributes
								data = el?.outerHTML ?? '';
							}
							chrome.runtime.sendMessage({ action: 'fetchResult', payload: { identifier, success: true, data } });
						} else {
							// Execute interactive actions (click/fill/typeSmoothly)
							const result = await performActionOnElement(payload);
							// Optionally we could send an acknowledgement to UI if needed later
						}
					} catch (err) {
						console.error('executeAction error:', err);
					}
					break;
				}

				case 'highlightInteractables': {
					try {
						clearHighlights();

						const INTERACTABLE_CHILD_SELECTOR = 'input,select,textarea,button,a[href],[role="button"]';

						// ** FIX 1: REMOVED 'fieldset' from this selector. **
						// A fieldset is a container, not an interactable element itself.
						// We also add `a[href]` to be more explicit about links.
						const selector = 'input:not([type="hidden"]),select,textarea,button,[role="button"],[tabindex],a[href]';

						const nodes = Array.from(document.querySelectorAll(selector))
							.filter(isVisible)
							.filter(el => {
								if (!el.hasAttribute('tabindex')) return true;
								const hasInteractableChildren = el.querySelector(INTERACTABLE_CHILD_SELECTOR);
								return !hasInteractableChildren;
							});

						for (const el of nodes) {
							if (el.hasAttribute('data-highlighter-outline') || el.closest('[data-highlighter-outline]')) {
								continue;
							}
							let targetElement = el;

							// This logic now correctly processes radios inside a fieldset.
							if (el.matches('input[type="checkbox"], input[type="radio"]')) {
								// For radio/checkboxes, we find the containing label or div to highlight the whole unit.
								targetElement = findControlGroupForInput(el);
							}

							try {
								const originalOutline = targetElement.style.outline;
								targetElement.setAttribute('data-highlighter-original-outline', originalOutline || '');
								targetElement.style.outline = '2px solid red';
								targetElement.setAttribute('data-highlighter-outline', 'true');
							} catch (e) { console.error('applyHighlight error for element:', el, e); }
						}

						const componentData = groupAndHighlightComponents();
						console.log('Detected Component Structure:', componentData);

						// Send the structured result back to the extension UI via background
						try {
							chrome.runtime.sendMessage({
								action: 'interactablesResult',
								payload: { components: componentData }
							});
						} catch (err) {
							console.error('Failed to send interactablesResult message:', err);
						}

					} catch (e) {
						console.error('highlightInteractables error:', e);
					}
					break;
				}

				// (The clearHighlights function remains the same as the previous version)
				default:
					break;
			}
		} catch (e) {
			console.error('messageHandler error:', e);
			// Best-effort error response for the two async sendResponse cases
			if (typeof sendResponse === 'function' && (request.action === 'EXTRACT_MAIN_CONTENT' || request.action === 'FIND_INTERACTABLE_ELEMENTS')) {
				try { sendResponse({ error: String(e && e.message || e) }); } catch (e) { console.error('Failed to send error response:', e); }
			}
		}
	})();
	// Keep the channel open only for actions that use sendResponse
	return request.action === 'EXTRACT_MAIN_CONTENT' || request.action === 'FIND_INTERACTABLE_ELEMENTS';
};
