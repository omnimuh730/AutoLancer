import { findElements, waitForElements } from './elementFinder';

function setNativeValue(element, value) {
	if (!element) return;
	const proto = element instanceof HTMLTextAreaElement
		? window.HTMLTextAreaElement?.prototype
		: element instanceof HTMLSelectElement
			? window.HTMLSelectElement?.prototype
			: window.HTMLInputElement?.prototype;

	const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
	const setter = descriptor?.set;
	if (setter) {
		setter.call(element, value);
	} else {
		element.value = value;
	}
}

const SELECTION_UNSUPPORTED_TYPES = new Set([
	'email', 'number', 'date', 'datetime-local', 'month', 'time', 'week'
]);

function supportsSelectionRange(element) {
	if (!element || typeof element.setSelectionRange !== 'function') return false;
	const type = (element.getAttribute?.('type') || element.type || 'text').toLowerCase();
	return !SELECTION_UNSUPPORTED_TYPES.has(type);
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
	return Math.random() * (max - min) + min;
}

/**
 * Types a string into an input element character by character to simulate smooth typing.
 * Uses a combination of value insertion and event dispatching to be compatible with modern frameworks.
 * @param {HTMLElement} element The input or textarea element.
 * @param {string} text The string to type.
 */
export async function typeSmoothly(element, text, options = {}) {
	if (!element) return;
	const stringText = text == null ? '' : String(text);

	const minDelayMs = Number.isFinite(options.minDelayMs) ? options.minDelayMs : 10;
	const maxDelayMs = Number.isFinite(options.maxDelayMs) ? options.maxDelayMs : 40;

	if (element && element.focus) element.focus();
	setNativeValue(element, '');
	element.dispatchEvent(new Event('input', { bubbles: true }));

	for (const char of stringText) {
		const nextValue = `${element.value ?? ''}${char}`;
		setNativeValue(element, nextValue);

		if (supportsSelectionRange(element)) {
			const length = nextValue.length;
			try {
				element.setSelectionRange(length, length);
			} catch {
				// Ignore browser quirks for specific input types.
			}
		}

		element.scrollLeft = element.scrollWidth;
		if (element instanceof HTMLTextAreaElement) {
			element.scrollTop = element.scrollHeight;
		}

		element.dispatchEvent(new Event('input', { bubbles: true }));
		await wait(randomBetween(minDelayMs, maxDelayMs));
	}

	element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function selectByText(element, selectionText) {
	if (!element) return { success: false, error: 'No element' };
	if (!(element instanceof HTMLSelectElement)) return { success: false, error: 'Target is not a <select>' };

	const desired = (selectionText == null ? '' : String(selectionText)).trim().toLowerCase();
	if (!desired) return { success: false, error: 'No selection text provided' };

	const option = Array.from(element.options || []).find((opt) => {
		const t = (opt?.textContent || '').trim().toLowerCase();
		return t === desired;
	});

	if (!option) {
		return { success: false, error: `No matching option for: ${selectionText}` };
	}

	element.value = option.value;
	element.dispatchEvent(new Event('input', { bubbles: true }));
	element.dispatchEvent(new Event('change', { bubbles: true }));
	return { success: true };
}

/**
 * Finds a specific element and performs an action on it.
 * @param {object} payload The details of the action to execute.
 */
export async function performActionOnElement(payload) {
	try {
		const { componentType, propertyName, pattern, order, action, value } = payload;
		let elements = findElements(componentType, propertyName, pattern);

		if (!elements || elements.length === 0) {
			console.debug('performAction: no elements found, waiting for DOM updates', { componentType, propertyName, pattern });
			elements = await waitForElements(componentType, propertyName, pattern, 2000, 100);
		}

		if (!elements || elements.length === 0) {
			const msg = "No elements found matching the criteria.";
			console.log(`Action failed: ${msg}`);
			return { success: false, error: msg };
		}

		const idx = Number.isFinite(order) ? Math.max(0, parseInt(order, 10)) : 0;
		if (idx >= elements.length) {
			const msg = `Order is ${idx}, but only ${elements.length} elements were found.`;
			console.log(`Action failed: ${msg}`);
			return { success: false, error: msg };
		}

		const targetElement = elements[idx];
		if (targetElement && targetElement.focus) targetElement.focus();

		switch (action) {
			case "click":
				targetElement.click();
				break;
			case "fill":
				setNativeValue(targetElement, value);
				targetElement.dispatchEvent(new Event('input', { bubbles: true }));
				targetElement.dispatchEvent(new Event('change', { bubbles: true }));
				break;
			case "typeSmoothly":
				await typeSmoothly(targetElement, value);
				break;
			case "selectByText": {
				const result = selectByText(targetElement, value);
				if (!result.success) return result;
				break;
			}
			default:
				return { success: false, error: `Unsupported action: ${action}` };
		}
		return { success: true };
	} catch (e) {
		return { success: false, error: String(e && e.message || e) };
	}
}
