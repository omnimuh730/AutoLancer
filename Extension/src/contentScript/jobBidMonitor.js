/* global chrome */

const TARGET_WORDS = [
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

const APPLIED_KEYWORDS = [
	'applied.',
	'application submitted',
	'submitted your application',
	'thanks for applying',
	'already applied',
	'you applied',
	'we have received your application',
	'thank you for your application',
	'thank you for applying',
	'we received your application',
	'we have received your proposal',
	'thank you for your proposal',
	'thanks for your proposal',
	'we received your proposal',
	'proposal sent',
	'proposal submitted',
	'bid submitted',
	'bid placed',
	'application received',
	'you have applied',
	'you have already applied'
];

const BUTTON_SELECTOR = 'button, a, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';
const KEY_TRIGGER_SET = new Set(['Enter', ' ']);
const hookedElements = new WeakSet();
const activeDetections = new WeakMap();
const MIN_DOM_DELTA = 0.2; // 20%
const MONITOR_WINDOW_MS = 15000;

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

function matchesTargetWord(element) {
	const candidates = collectTextCandidates(element);
	if (!candidates.length) return false;
	const lowered = candidates.map((text) => text.toLowerCase());
	return lowered.some((text) => TARGET_WORDS.some((word) => text.includes(word)));
}

function getPrimaryLabel(element) {
	const candidates = collectTextCandidates(element);
	if (candidates.length) return candidates[0];
	return element?.tagName?.toLowerCase() || 'unknown';
}

function buildElementSignature(element) {
	if (!element || !element.tagName) return 'unknown';
	const tag = element.tagName.toLowerCase();
	const idPart = element.id ? `#${element.id}` : '';
	const classPart = typeof element.className === 'string' && element.className.trim()
		? `.${element.className.trim().replace(/\s+/g, '.')}`
		: '';
	return `${tag}${idPart}${classPart}`;
}

function getBodyTextLength() {
	const text = document?.body?.innerText || '';
	return text.length;
}

function scanElementAndChildren(root) {
	if (!(root instanceof Element)) return;
	if (root.matches?.(BUTTON_SELECTOR)) {
		hookElement(root);
	}
	const candidates = root.querySelectorAll?.(BUTTON_SELECTOR);
	if (candidates?.length) {
		candidates.forEach((el) => hookElement(el));
	}
}

function hookElement(element) {
	if (!element || hookedElements.has(element)) return;
	if (!matchesTargetWord(element)) return;

	const handleClick = () => startDetection(element);
	const handleKeyDown = (event) => {
		if (KEY_TRIGGER_SET.has(event.key)) {
			startDetection(element);
		}
	};

	hookedElements.add(element);
	element.dataset.jobBidHooked = 'true';
	element.addEventListener('click', handleClick, true);
	element.addEventListener('keydown', handleKeyDown, true);
}

function reportJobBid(payload) {
	try {
		chrome?.runtime?.sendMessage?.({
			action: 'jobBidApplied',
			payload
		});
	} catch (e) {
		console.error('Failed to send jobBidApplied message', e);
	}
}

function createDetection(element) {
	const baselineUrl = window.location.href;
	const baselineLength = getBodyTextLength();
	let domChangePercent = 0;
	let matchedKeyword = null;
	let observer = null;
	let keywordInterval = null;
	let urlInterval = null;
	let timeoutId = null;
	let finished = false;

	const cleanup = () => {
		if (observer) observer.disconnect();
		if (keywordInterval) window.clearInterval(keywordInterval);
		if (urlInterval) window.clearInterval(urlInterval);
		if (timeoutId) window.clearTimeout(timeoutId);
		observer = null;
		keywordInterval = null;
		urlInterval = null;
		timeoutId = null;
	};

	const finalize = (reason) => {
		if (finished) return;
		finished = true;
		cleanup();
		activeDetections.delete(element);
		if (reason === 'timeout' || reason === 'cancelled') return;

		const payload = {
			reason,
			buttonText: getPrimaryLabel(element),
			buttonSignature: buildElementSignature(element),
			urlBefore: baselineUrl,
			urlAfter: window.location.href,
			domChangePercent: Number(domChangePercent.toFixed(3)),
			matchedKeyword,
			timestamp: Date.now()
		};

		reportJobBid(payload);
	};

	const monitorDom = () => {
		const currentLength = getBodyTextLength();
		const delta = Math.abs(currentLength - baselineLength);
		const base = Math.max(1, baselineLength);
		domChangePercent = delta / base;
		if (domChangePercent >= MIN_DOM_DELTA) {
			finalize('dom-change');
		}
	};

	const monitorKeywords = () => {
		const bodyText = (document?.body?.innerText || '').toLowerCase();
		const match = APPLIED_KEYWORDS.find((keyword) => bodyText.includes(keyword));
		if (match) {
			matchedKeyword = match;
			finalize('keyword');
		}
	};

	const monitorUrl = () => {
		if (window.location.href !== baselineUrl) {
			finalize('url-change');
		}
	};

	return {
		start() {
			if (!document?.body) return;
			try {
				observer = new MutationObserver(monitorDom);
				observer.observe(document.body, { childList: true, subtree: true, characterData: true });
			} catch (e) {
				console.error('jobBidMonitor: failed to observe DOM', e);
			}
			keywordInterval = window.setInterval(monitorKeywords, 500);
			urlInterval = window.setInterval(monitorUrl, 200);
			timeoutId = window.setTimeout(() => finalize('timeout'), MONITOR_WINDOW_MS);
		},
		cancel() {
			finalize('cancelled');
		}
	};
}

function startDetection(element) {
	if (!element || !document?.body) return;
	const existing = activeDetections.get(element);
	if (existing) return;

	const detection = createDetection(element);
	activeDetections.set(element, detection);
	detection.start();
}

function observeNewButtons() {
	if (!document?.body) return;
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (!mutation.addedNodes?.length) continue;
			mutation.addedNodes.forEach((node) => {
				if (node instanceof Element) {
					scanElementAndChildren(node);
				}
			});
		}
	});
	try {
		observer.observe(document.body, { childList: true, subtree: true });
	} catch (e) {
		console.error('jobBidMonitor: failed to observe for new buttons', e);
	}
}

function handleFormSubmit(event) {
	const submitter = event.submitter;
	if (submitter && matchesTargetWord(submitter)) {
		startDetection(submitter);
		return;
	}
	const fallbackButton = event.target?.querySelector?.(BUTTON_SELECTOR);
	if (fallbackButton && matchesTargetWord(fallbackButton)) {
		startDetection(fallbackButton);
	}
}

export function initJobBidMonitor() {
	if (window.__jobBidMonitorInitialized) return;
	window.__jobBidMonitorInitialized = true;

	const boot = () => {
		try {
			scanElementAndChildren(document.body || document.documentElement);
			observeNewButtons();
			document.addEventListener('submit', handleFormSubmit, true);
		} catch (e) {
			console.error('Failed to initialize job bid monitor', e);
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot, { once: true });
	} else {
		boot();
	}
}
