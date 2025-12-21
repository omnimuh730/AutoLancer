import { findElements, waitForElements } from './elementFinder';

/**
 * Types a string into an input element character by character to simulate smooth typing.
 * Uses a combination of value insertion and event dispatching to be compatible with modern frameworks.
 * @param {HTMLElement} element The input or textarea element.
 * @param {string} text The string to type.
 */
export function typeSmoothly(element, text) {
	return new Promise((resolve) => {
		let i = 0;
		// Clear existing value
		element.value = '';

		// Some frameworks need 'input' and 'change' events even for clearing
		element.dispatchEvent(new Event('input', { bubbles: true }));

		const interval = setInterval(() => {
			if (i < text.length) {
				const char = text.charAt(i);

				// Simulate keydown
				element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));

				// Update value - this is the part that often battles with the framework.
				// We do not append; we set the absolute value based on what we've 'typed' so far.
				// This prevents doubling if the framework also appends on keydown/input.
				const currentExpectedValue = text.substring(0, i + 1);
				element.value = currentExpectedValue;

				// Simulate input event
				element.dispatchEvent(new Event('input', { bubbles: true }));

				// Simulate keyup
				element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

				i++;
			} else {
				clearInterval(interval);
				element.dispatchEvent(new Event('change', { bubbles: true }));
				resolve();
			}
		}, 80); // Increased delay to allow framework state updates to settle
	});
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
				targetElement.value = value;
				targetElement.dispatchEvent(new Event('input', { bubbles: true }));
				targetElement.dispatchEvent(new Event('change', { bubbles: true }));
				break;
			case "typeSmoothly":
				await typeSmoothly(targetElement, value);
				break;
			default:
				return { success: false, error: `Unsupported action: ${action}` };
		}
		return { success: true };
	} catch (e) {
		return { success: false, error: String(e && e.message || e) };
	}
}
