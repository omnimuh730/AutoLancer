import { findElements, waitForElements } from './elementFinder';

/**
 * Types a string into an input element character by character to simulate smooth typing.
 * @param {HTMLElement} element The input or textarea element.
 * @param {string} text The string to type.
 */
export function typeSmoothly(element, text) {
	return new Promise((resolve) => {
		let i = 0;
		element.value = '';
		const interval = setInterval(() => {
			if (i < text.length) {
				element.value += text.charAt(i);
				element.dispatchEvent(new Event('input', { bubbles: true }));
				i++;
			} else {
				clearInterval(interval);
				element.dispatchEvent(new Event('change', { bubbles: true }));
				resolve();
			}
		}, 50);
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
