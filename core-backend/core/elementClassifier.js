// core/elementClassifier.js

function classifyInteractionType(children) {
	if (!children || children.length === 0) return 'UNKNOWN';

	// Helper to safely check properties
	const getType = (c) => (c.properties?.type || '').toLowerCase();
	const getRole = (c) => (c.properties?.role || '').toLowerCase();
	const hasAriaDropdown = (c) => String(c?.properties?.['aria-haspopup'] || '').toLowerCase() === 'true';

	// 1. Check for File Upload
	const fileInput = children.find(c => c.tag === 'input' && getType(c) === 'file');
	if (fileInput) return 'UPLOAD';

	// 2. Check for Select (Native Dropdowns) (must come before text inputs for Select2-like widgets)
	const selectInput = children.find(c => c.tag === 'select');
	if (selectInput) return 'SELECT';

	// 3. Check for Text Inputs
	// Includes standard inputs and textareas. IMPORTANT: Some groups contain both a combobox
	// (e.g., phone country) and a regular input (e.g., phone number). Prefer the regular input.
	const isTextInputType = (t) => ['text', 'email', 'tel', 'url', 'number', 'password', ''].includes(t);

	const plainTextInput = children.find((c) => {
		if (c.tag === 'textarea') return true;
		if (c.tag !== 'input') return false;
		if (!isTextInputType(getType(c))) return false;
		const role = getRole(c);
		if (role === 'combobox') return false;
		if (hasAriaDropdown(c)) return false;
		return true;
	});
	if (plainTextInput) return 'TYPING';

	// 4. Special handling for Comboboxes
	// Sometimes the role is on the input, sometimes on a wrapping div in the children list.
	const combobox = children.find((c) => getRole(c) === 'combobox' || hasAriaDropdown(c));
	if (combobox) return 'COMBOBOX';

	// 5. Check for Selection Groups (Radios, Checkboxes, Button Toggles)

	// Case A: Direct Button/Link toggles
	const buttons = children.filter(c => c.tag === 'button' || c.tag === 'a');

	// Case B: Direct Input Radios/Checkboxes
	const directInputs = children.filter(c =>
		c.tag === 'input' && ['radio', 'checkbox'].includes(getType(c))
	);

	// Case C: Inputs wrapped in Labels (THIS FIXES YOUR ISSUE)
	// We check the innerHTML for specific input patterns
	const wrappedInputs = children.filter(c => {
		if (c.tag !== 'label') return false;
		const inner = (c.innerHTML || '').toLowerCase();
		return inner.includes('type="radio"') || inner.includes('type="checkbox"');
	});

	// If we have multiple clickable options, it's a selection group
	if (buttons.length > 0 || directInputs.length > 0 || wrappedInputs.length > 0) {
		return 'SELECTION_GROUP';
	}

	return 'UNKNOWN';
}

module.exports = { classifyInteractionType };
