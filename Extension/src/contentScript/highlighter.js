import { findElements } from './elementFinder';

let highlightCounter = 1;
let highlightLabels = [];

export function clearHighlights() {
	highlightLabels.forEach((label) => label.remove());
	highlightLabels = [];
	document.querySelectorAll("[data-highlighter-outline]").forEach((el) => {
		el.style.outline =
			el.getAttribute("data-highlighter-original-outline") || "";
		el.removeAttribute("data-highlighter-outline");
		el.removeAttribute("data-highlighter-original-outline");
		el.removeAttribute("data-highlighter-id");
	});
	highlightCounter = 1;
}


/**
 * Applies a colored outline and a label to a single DOM element.
 * @param {HTMLElement} element The element to highlight.
 * @param {string} color The color of the outline (e.g., 'red', 'blue').
 */
export function applyHighlight(element, color) {
	if (element.hasAttribute("data-highlighter-outline")) return;
	if (!element.getBoundingClientRect().width || !element.getBoundingClientRect().height) return;
	const originalOutline = element.style.outline;
	element.setAttribute("data-highlighter-original-outline", originalOutline || "");
	element.setAttribute("data-highlighter-id", highlightCounter);
	element.style.outline = `2px solid ${color}`;
	element.setAttribute("data-highlighter-outline", "true");
	addLabel(element, highlightCounter);
	highlightCounter++;
}

/**
 * A helper function that finds and highlights elements matching a pattern.
 * @param {string} componentType The tag name (e.g., 'div').
 * @param {string} propertyName The attribute to search against.
 * @param {string} pattern The pattern for the property's value.
 * @param {string} color The highlight color.
 */
export function highlightByPattern(componentType, propertyName, pattern, color) {
	const elementsToHighlight = findElements(componentType, propertyName, pattern);
	elementsToHighlight.forEach(el => applyHighlight(el, color));
	console.log(`Found and highlighted ${elementsToHighlight.length} elements.`);
}

function addLabel(el, id) {
	const rect = el.getBoundingClientRect();
	const label = document.createElement("div");
	label.textContent = id;
	label.style.position = "fixed";
	// For fixed positioning, use viewport coordinates directly (no scroll offsets)
	const top = Math.max(0, rect.top - 14);
	label.style.left = `${rect.left}px`;
	label.style.top = `${top}px`;
	label.style.background = "red";
	label.style.color = "white";
	label.style.fontSize = "12px";
	label.style.fontWeight = "bold";
	label.style.padding = "0 3px";
	label.style.border = "1px solid black";
	label.style.zIndex = 999999;
	label.style.pointerEvents = "none";
	document.body.appendChild(label);
	highlightLabels.push(label);
}
