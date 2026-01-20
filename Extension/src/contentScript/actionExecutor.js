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

function normalizeText(text) {
	return (text == null ? '' : String(text)).trim().replace(/\s+/g, ' ').toLowerCase();
}

function deriveSelectionCandidates(text) {
	const raw = text == null ? '' : String(text);
	const candidates = new Set();

	for (const phrase of extractQuotedPhrases(raw)) candidates.add(phrase);
	candidates.add(raw);

	const cleaned = raw
		.replace(/^[\s\-–—]*\b(please\s+)?(select|choose|pick)\b[:\s]*/i, '')
		.replace(/[.!\s]+$/g, '')
		.trim();
	if (cleaned) candidates.add(cleaned);

	const lowered = normalizeText(raw);
	if (lowered.startsWith('yes')) candidates.add('Yes');
	if (lowered.startsWith('no')) candidates.add('No');

	return Array.from(candidates).filter(Boolean);
}

function extractQuotedPhrases(text) {
	const value = text == null ? '' : String(text);
	const phrases = [];
	const regex = /"([^"]+)"|“([^”]+)”/g;
	let match;
	while ((match = regex.exec(value)) !== null) {
		const phrase = (match[1] || match[2] || '').trim();
		if (phrase) phrases.push(phrase);
	}
	return phrases;
}

function getSelect2Container(element) {
	if (!element) return null;
	if (element.classList?.contains('select2-container')) return element;
	return element.closest?.('.select2-container') || null;
}

function getUnderlyingSelectForSelect2(container) {
	if (!container) return null;
	// Select2 v3 uses container id like "s2id_<originalId>"
	const id = container.getAttribute('id') || '';
	if (id && id.startsWith('s2id_')) {
		const originalId = id.slice('s2id_'.length);
		const candidate = document.getElementById(originalId);
		if (candidate instanceof HTMLSelectElement) return candidate;
	}

	// Sometimes the original <select> lives next to the container or inside it.
	const inside = container.querySelector?.('select');
	if (inside instanceof HTMLSelectElement) return inside;
	const prev = container.previousElementSibling;
	if (prev instanceof HTMLSelectElement) return prev;

	return null;
}

function openSelect2(container) {
	const opener = container?.querySelector?.('a.select2-choice, .select2-selection, [role="button"]') || container;
	try {
		opener.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	} catch {
		// best effort
	}
	try {
		opener.click();
	} catch {
		// best effort
	}
}

async function waitForSelect2Dropdown(timeoutMs = 2000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const v3 = document.querySelector('.select2-drop-active, .select2-drop.select2-drop-active');
		if (v3) return v3;
		const v4 = document.querySelector('.select2-dropdown');
		if (v4) return v4;
		await wait(50);
	}
	return null;
}

function scoreTokenOverlap(a, b) {
	const ta = new Set(normalizeText(a).split(' ').filter(Boolean));
	const tb = new Set(normalizeText(b).split(' ').filter(Boolean));
	if (!ta.size || !tb.size) return 0;
	let overlap = 0;
	for (const t of ta) if (tb.has(t)) overlap++;
	return overlap / Math.max(ta.size, tb.size);
}

function findBestMatchingNode(nodes, desiredText) {
	if (!Array.isArray(nodes) || nodes.length === 0) return null;
	const desired = normalizeText(desiredText);
	if (!desired) return null;

	// Exact
	for (const node of nodes) {
		const text = normalizeText(node?.textContent || node?.innerText || '');
		if (text === desired) return node;
	}
	// Contains
	for (const node of nodes) {
		const text = normalizeText(node?.textContent || node?.innerText || '');
		if (text && text.includes(desired)) return node;
	}
	// Reverse contains (desired contains option) for long instruction strings
	for (const node of nodes) {
		const text = normalizeText(node?.textContent || node?.innerText || '');
		if (text && desired.includes(text)) return node;
	}

	// Fuzzy token overlap (handles "Not a veteran." vs "I am not a protected veteran")
	let best = null;
	let bestScore = 0;
	for (const node of nodes) {
		const text = node?.textContent || node?.innerText || '';
		const score = scoreTokenOverlap(desiredText, text);
		if (score > bestScore) {
			bestScore = score;
			best = node;
		}
	}
	if (best && bestScore >= 0.34) return best;

	return null;
}

function getSelect2ChosenText(container) {
	if (!container) return '';
	const chosen = container.querySelector('.select2-chosen, .select2-selection__rendered');
	return (chosen?.textContent || chosen?.innerText || '').trim();
}

async function selectFromSelect2(element, selectionText) {
	const container = getSelect2Container(element) || getSelect2Container(element?.parentElement);
	if (!container) return { success: false, error: 'Select2 container not found' };

	const candidates = deriveSelectionCandidates(selectionText);
	const underlyingSelect = getUnderlyingSelectForSelect2(container);

	if (underlyingSelect) {
		for (const candidate of candidates) {
			const desired = normalizeText(candidate);
			if (!desired) continue;
			const option = Array.from(underlyingSelect.options || []).find((opt) => normalizeText(opt?.textContent || '') === desired)
				|| Array.from(underlyingSelect.options || []).find((opt) => normalizeText(opt?.textContent || '').includes(desired));

			if (option) {
				underlyingSelect.value = option.value;
				underlyingSelect.dispatchEvent(new Event('input', { bubbles: true }));
				underlyingSelect.dispatchEvent(new Event('change', { bubbles: true }));

				try {
					// If the page uses jQuery + Select2, triggering via jQuery helps Select2 sync UI reliably.
					if (window.jQuery) {
						window.jQuery(underlyingSelect).val(option.value).trigger('change');
					}
				} catch {
					// best effort
				}

				// Verify display updated; if not, fall back to UI selection.
				const chosenNow = normalizeText(getSelect2ChosenText(container));
				const expected = normalizeText(option.textContent || '');
				if (chosenNow && expected && (chosenNow === expected || chosenNow.includes(expected))) {
					return { success: true };
				}
				break;
			}
		}
	}

	openSelect2(container);
	const dropdown = await waitForSelect2Dropdown(2000);
	if (!dropdown) return { success: false, error: 'Select2 dropdown did not open' };

	// Type into search field if present to narrow results.
	const searchInput = dropdown.querySelector('input.select2-input, .select2-search input, input.select2-search__field');
	if (searchInput) {
		searchInput.focus?.();
		const primary = candidates[0] || '';
		setNativeValue(searchInput, primary);
		searchInput.dispatchEvent(new Event('input', { bubbles: true }));
		searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
		await wait(100);
	}

	// Collect option nodes across Select2 v3/v4.
	const v3Labels = Array.from(dropdown.querySelectorAll('.select2-results li .select2-result-label'));
	const v3Lis = Array.from(dropdown.querySelectorAll('.select2-results li'));
	const v4Options = Array.from(dropdown.querySelectorAll('.select2-results__option')).filter((n) => !n.classList?.contains('select2-results__option--disabled'));
	const optionNodes = [...(v3Lis.length ? v3Lis : v3Labels), ...v4Options].filter(Boolean);

	for (const candidate of candidates) {
		const match = findBestMatchingNode(optionNodes, candidate);
		if (!match) continue;
		const clickable = match.closest?.('li') || match;
		clickable.scrollIntoView?.({ block: 'nearest' });
		try {
			clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		} catch {
			// best effort
		}
		clickable.click?.();

		const chosenNow = normalizeText(getSelect2ChosenText(container));
		const expected = normalizeText(candidate);
		if (chosenNow && expected && (chosenNow === expected || chosenNow.includes(expected) || expected.includes(chosenNow))) {
			return { success: true };
		}
		return { success: true };
	}

	// Last resort: keyboard selection (first result / best guess).
	if (searchInput) {
		searchInput.focus?.();
		searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
		return { success: true };
	}

	return { success: false, error: 'No matching Select2 option found' };
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

async function selectFromAriaDropdown(element, selectionText) {
	const candidates = [...extractQuotedPhrases(selectionText), selectionText].filter(Boolean);
	const desired = candidates[0] || '';

	element.focus?.();
	try {
		element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
		element.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
	} catch {
		// best effort
	}
	try {
		element.click?.();
	} catch {
		// best effort
	}

	await wait(100);

	// Some widgets accept typing to filter/select.
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
		await typeSmoothly(element, desired);
	}

	try {
		element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
	} catch {
		// best effort
	}

	return { success: true };
}

export async function selectByText(element, selectionText) {
	if (!element) return { success: false, error: 'No element' };

	// Native <select>
	if (element instanceof HTMLSelectElement) {
		const desired = normalizeText(selectionText);
		if (!desired) return { success: false, error: 'No selection text provided' };

		const option = Array.from(element.options || []).find((opt) => normalizeText(opt?.textContent || '') === desired)
			|| Array.from(element.options || []).find((opt) => normalizeText(opt?.textContent || '').includes(desired));

		if (!option) {
			return { success: false, error: `No matching option for: ${selectionText}` };
		}

		element.value = option.value;
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.dispatchEvent(new Event('change', { bubbles: true }));
		return { success: true };
	}

	// Select2 / JS dropdown (e.g. role="button" + aria-haspopup or select2-focusser)
	if (getSelect2Container(element)) {
		return selectFromSelect2(element, selectionText);
	}

	const isAriaDropdown = element.getAttribute?.('aria-haspopup') === 'true' || (element.getAttribute?.('role') || '').toLowerCase() === 'button';
	if (isAriaDropdown) {
		return selectFromAriaDropdown(element, selectionText);
	}

	return { success: false, error: 'Target is not a <select> or supported dropdown' };
}

export async function selectByIndex(element, selectedIndex) {
	if (!element) return { success: false, error: 'No element' };
	const idx = Number.isFinite(selectedIndex) ? selectedIndex : parseInt(selectedIndex, 10);
	if (!Number.isFinite(idx) || idx < 0) return { success: false, error: 'Invalid selectedIndex' };

	if (element instanceof HTMLSelectElement) {
		if (!element.options || idx >= element.options.length) {
			return { success: false, error: `selectedIndex ${idx} out of range` };
		}
		const option = element.options[idx];
		element.value = option.value;
		element.dispatchEvent(new Event('input', { bubbles: true }));
		element.dispatchEvent(new Event('change', { bubbles: true }));
		return { success: true };
	}

	// If a Select2 container/input was passed, resolve to its underlying <select> and select there.
	if (getSelect2Container(element)) {
		const container = getSelect2Container(element);
		const underlyingSelect = getUnderlyingSelectForSelect2(container);
		if (underlyingSelect) return selectByIndex(underlyingSelect, idx);
	}

	return { success: false, error: 'Target is not a <select> or supported dropdown' };
}

function getScopedChildren(parentElement) {
	if (!parentElement) return [];
	const outlined = Array.from(parentElement.querySelectorAll('[data-highlighter-outline]'));
	if (outlined.length) return outlined;
	return Array.from(parentElement.querySelectorAll('input,textarea,button,a[href],[role="button"]'));
}

async function resolveScopedTarget(payload) {
	const scope = payload?.scope;
	if (!scope) return null;
	const { componentType, propertyName, pattern, order } = scope;

	let parents = findElements(componentType, propertyName, pattern);
	if (!parents || parents.length === 0) {
		parents = await waitForElements(componentType, propertyName, pattern, 2000, 100);
	}
	if (!parents || parents.length === 0) return null;

	const parentIndex = Number.isFinite(order) ? Math.max(0, parseInt(order, 10)) : 0;
	const parentElement = parents[parentIndex] || parents[0];
	if (!parentElement) return null;

	const childIndex = Number.isFinite(payload.childIndex) ? payload.childIndex : parseInt(payload.childIndex, 10);
	if (Number.isFinite(childIndex) && childIndex >= 0) {
		const byIndexAttr = parentElement.querySelector?.(`[data-autolancer-child-index="${childIndex}"]`);
		if (byIndexAttr) return byIndexAttr;

		const children = getScopedChildren(parentElement);
		if (childIndex < children.length) return children[childIndex];
	}

	return null;
}

async function performScopedSelect(payload) {
	const scopedTarget = await resolveScopedTarget(payload);
	if (!scopedTarget) return { success: false, error: 'Scoped target not found' };

	const selectedIndex = payload?.selectedIndex;
	if (selectedIndex !== undefined && selectedIndex !== null) {
		const byIndex = await selectByIndex(scopedTarget, selectedIndex);
		if (byIndex.success) return { success: true };
	}

	const selectionText = payload?.value;
	const selectResult = await selectByText(scopedTarget, selectionText);
	if (!selectResult.success) return selectResult;
	return { success: true };
}

/**
 * Finds a specific element and performs an action on it.
 * @param {object} payload The details of the action to execute.
 */
export async function performActionOnElement(payload) {
	try {
		const { componentType, propertyName, pattern, order, action, value } = payload;

		if (action === 'fillScoped' || action === 'clickScoped') {
			const scopedTarget = await resolveScopedTarget(payload);
			if (!scopedTarget) return { success: false, error: 'Scoped target not found' };

			if (action === 'clickScoped') {
				scopedTarget.focus?.();
				scopedTarget.click?.();
				return { success: true };
			}

			let fillTarget = scopedTarget;
			if (!(fillTarget instanceof HTMLInputElement || fillTarget instanceof HTMLTextAreaElement)) {
				fillTarget = scopedTarget.querySelector?.('input,textarea') || fillTarget;
			}
			if (!(fillTarget instanceof HTMLInputElement || fillTarget instanceof HTMLTextAreaElement)) {
				return { success: false, error: 'Scoped fill target is not an input/textarea' };
			}

			fillTarget.focus?.();
			setNativeValue(fillTarget, value);
			fillTarget.dispatchEvent(new Event('input', { bubbles: true }));
			fillTarget.dispatchEvent(new Event('change', { bubbles: true }));
			return { success: true };
		}

		if (action === 'selectByTextScoped') {
			return await performScopedSelect(payload);
		}

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
				if (payload?.selectedIndex !== undefined && payload?.selectedIndex !== null) {
					const byIndex = await selectByIndex(targetElement, payload.selectedIndex);
					if (byIndex.success) break;
				}
				const result = await selectByText(targetElement, value);
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
