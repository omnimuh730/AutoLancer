// core/staticfieldDetector.js
const { getProfileValue } = require("./getFunctionCalling");

function getMeaningfulContext(parentElement, childElement) {
	let parentText = parentElement.innerText || '';

	// Remove "Required" asterisks or common UI noise
	parentText = parentText.replace(/\*/g, '').trim();

	// Ideally, we subtract child text from parent text to get the Label
	// (e.g. "Name [Input]" -> "Name")
	const childText = (childElement || []).map(child => child.innerText || '').join('');

	// Simple heuristic: if parent starts with specific text, use it.
	// In a real browser DOM we would use <label for="id">, but here we analyze text structure.

	// If the label is clearly separated by newlines, take the top part
	const splitText = parentText.split('\n');
	if (splitText.length > 0) {
		// Return the longest distinct string that isn't the child's value
		// For now, returning the full lowercase parent text is the safest "context" bucket
		return parentText.toLowerCase();
	}

	return parentText.toLowerCase();
};

const staticFieldDetectionRule = [
	{ field: 'firstname', tags: ['first name', 'given name'] },
	{ field: 'lastname', tags: ['last name', 'family name', 'surname'] },
	{ field: 'name', tags: ['full name', 'name'] },
	{ field: 'email', tags: ['email'] },
	{ field: 'phonenumber', tags: ['phone', 'mobile', 'telephone'] },
	{ field: 'linkedin', tags: ['linkedin'] },
	{ field: 'github', tags: ['github'] },
	{ field: 'portfolio', tags: ['portfolio', 'website'] },
	{ field: 'location', tags: ['location', 'city', 'address'] },
	{ field: 'resume', tags: ['resume', 'cv', 'curriculum vitae'] },
	{ field: 'coverletter', tags: ['cover letter'] },
	{ field: 'work_authorization', tags: ['legally authorized', 'work in the', 'eligibility'] },
	{ field: 'sponsorship_required', tags: ['sponsorship', 'visa', 'h-1b'] },
	{ field: 'salary_expectation', tags: ['salary', 'compensation', 'pay'] }
];

function identifyFieldIntent(context) {
	for (const rule of staticFieldDetectionRule) {
		if (rule.tags.some(tag => context.includes(tag))) {
			return { isStatic: true, field: rule.field };
		}
	}
	return { isStatic: false, field: null };
}

module.exports = { identifyFieldIntent, getMeaningfulContext };