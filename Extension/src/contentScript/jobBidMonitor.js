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
	'thank you for applying',
	'thanks so much for applying',
	'already applied',
	'you applied',
	'application received',
	'application has been received',
	'we have received your application',
	'thank you for your application',
	'we received your application',
	'we have received your proposal',
	'thank you for your proposal',
	'thanks for your proposal',
	'we received your proposal',
	'proposal sent',
	'proposal submitted',
	'bid submitted',
	'bid placed',
	'you have applied',
	'you have already applied'
];

const BUTTON_SELECTOR = 'button, a, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';
const KEY_TRIGGER_SET = new Set(['Enter', ' ']);
const hookedElements = new WeakSet();
const activeDetections = new WeakMap();
const MIN_DOM_DELTA = 0.2; // 20%
const MONITOR_WINDOW_MS = 15000;
let buttonReportScheduled = false;

function containsAppliedKeyword(text) {
	if (!text || typeof text !== 'string') return null;
	const lowered = text.toLowerCase();
	return APPLIED_KEYWORDS.find((keyword) => lowered.includes(keyword));
}

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
	scheduleButtonReport();
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

function sendJobBidStatus(status) {
	try {
		chrome?.runtime?.sendMessage?.({
			action: 'jobBidStatus',
			payload: {
				...status,
				jobUrl: status?.jobUrl || window.location.href,
				timestamp: status?.timestamp || Date.now()
			}
		});
	} catch (e) {
		console.error('Failed to send jobBidStatus', e);
	}
}

function summarizeButton(element) {
	return {
		text: getPrimaryLabel(element),
		signature: buildElementSignature(element),
		tag: element?.tagName?.toLowerCase() || ''
	};
}

function collectTargetButtons(root = document) {
	const scope = root instanceof Element ? root : document;
	return Array.from(scope.querySelectorAll(BUTTON_SELECTOR)).filter(matchesTargetWord);
}

function reportCurrentButtons() {
	const matches = collectTargetButtons(document);
	if (matches.length === 0) {
		sendJobBidStatus({
			state: 'no-buttons',
			buttonCount: 0
		});
		return;
	}
	sendJobBidStatus({
		state: 'buttons-found',
		buttonCount: matches.length,
		buttons: matches.slice(0, 6).map(summarizeButton)
	});
}

function scheduleButtonReport() {
	if (buttonReportScheduled) return;
	buttonReportScheduled = true;
	requestAnimationFrame(() => {
		buttonReportScheduled = false;
		reportCurrentButtons();
	});
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
	let handleUnload = null;
	let finished = false;

	const cleanup = () => {
		if (observer) observer.disconnect();
		if (keywordInterval) window.clearInterval(keywordInterval);
		if (urlInterval) window.clearInterval(urlInterval);
		if (timeoutId) window.clearTimeout(timeoutId);
		if (handleUnload) {
			window.removeEventListener('pagehide', handleUnload, true);
			window.removeEventListener('beforeunload', handleUnload, true);
			handleUnload = null;
		}
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
		const currentUrl = window.location.href;

		if (reason === 'timeout' || reason === 'cancelled') {
			sendJobBidStatus({
				state: 'not-counted',
				reason,
				button: summarizeButton(element),
				jobUrl: currentUrl
			});
			return;
		}

		const payload = {
			reason,
			buttonText: getPrimaryLabel(element),
			buttonSignature: buildElementSignature(element),
			jobUrl: currentUrl,
			urlBefore: baselineUrl,
			urlAfter: currentUrl,
			domChangePercent: Number(domChangePercent.toFixed(3)),
			matchedKeyword,
			timestamp: Date.now()
		};

		sendJobBidStatus({
			state: 'applied',
			reason,
			button: summarizeButton(element),
			jobUrl: currentUrl
		});
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
		const bodyMatch = containsAppliedKeyword(document?.body?.innerText || '');
		const titleMatch = containsAppliedKeyword(document?.title || '');
		const match = bodyMatch || titleMatch;
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
			handleUnload = () => finalize('url-change');
			window.addEventListener('pagehide', handleUnload, true);
			window.addEventListener('beforeunload', handleUnload, true);
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
	sendJobBidStatus({
		state: 'triggered',
		button: summarizeButton(element),
		jobUrl: window.location.href
	});
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
		scheduleButtonReport();
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
			scheduleButtonReport();
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
