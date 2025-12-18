const SUBMIT_TARGET_KEYWORDS = [
	'submit',
	'send application',
	'send proposal',
	'apply',
	'apply now',
	'apply today',
	'register',
	'sign up',
	'sign me up',
	'get started',
	'join now',
	'next',
	'continue',
	'bid',
	'place bid',
	'send bid',
	'confirm'
];

function collectTextCandidates(element) {
	if (!element) return [];
	const candidates = [
		element.innerText,
		element.value,
		element.textContent,
		element.getAttribute?.('aria-label'),
		element.getAttribute?.('title'),
		element.getAttribute?.('data-testid'),
		element.getAttribute?.('name'),
		element.getAttribute?.('id')
	];

	return candidates
		.map((text) => (typeof text === 'string' ? text.trim() : ''))
		.filter(Boolean);
}

function matchesSubmitKeyword(element, keywords = SUBMIT_TARGET_KEYWORDS) {
	const keywordPool = Array.isArray(keywords) && keywords.length ? keywords : SUBMIT_TARGET_KEYWORDS;
	const candidates = collectTextCandidates(element);
	if (!candidates.length) return false;
	const lowered = candidates.map((text) => text.toLowerCase());
	return lowered.some((text) => keywordPool.some((word) => text.includes(word)));
}

module.exports = { matchesSubmitKeyword };