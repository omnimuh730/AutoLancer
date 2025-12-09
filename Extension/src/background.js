/* global chrome */
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

// Actions that need to be sent to the content script
const actionsToForward = [
  "highlightByPattern",
  "highlightBySelectors",
  "highlightInteractables",
  "executePlan",
  "collectDomHints",
  "clearHighlight",
  "executeAction"
];

const JOB_BID_STORAGE_KEY = 'jobBidStats';
const MAX_RECENT_JOB_EVENTS = 5;
const DEFAULT_JOB_BID_STATS = {
	total: 0,
	recent: []
};

let jobBidStats = { ...DEFAULT_JOB_BID_STATS };

function normalizeStats(stats) {
	if (!stats || typeof stats !== 'object') return { ...DEFAULT_JOB_BID_STATS };
	const total = Number.isFinite(stats.total) ? stats.total : 0;
	const recent = Array.isArray(stats.recent) ? stats.recent.slice(0, MAX_RECENT_JOB_EVENTS) : [];
	return {
		total,
		recent
	};
}

function loadJobBidStats() {
	try {
		chrome.storage?.local?.get(JOB_BID_STORAGE_KEY, (items) => {
			if (chrome.runtime.lastError) {
				console.error('Failed to read job bid stats', chrome.runtime.lastError);
				return;
			}
			const stored = items?.[JOB_BID_STORAGE_KEY];
			jobBidStats = normalizeStats(stored);
		});
	} catch (e) {
		console.error('Error loading job bid stats', e);
	}
}

function persistJobBidStats() {
	try {
		chrome.storage?.local?.set({ [JOB_BID_STORAGE_KEY]: jobBidStats }, () => {
			if (chrome.runtime.lastError) {
				console.error('Failed to persist job bid stats', chrome.runtime.lastError);
			}
		});
	} catch (e) {
		console.error('Error persisting job bid stats', e);
	}
}

function broadcastJobBidStats() {
	try {
		chrome.runtime.sendMessage({ action: 'jobBidStats', payload: jobBidStats });
	} catch (e) {
		console.error('Failed to broadcast job bid stats', e);
	}
}

function recordJobBid(payload) {
	jobBidStats.total += 1;
	const recentEvent = {
		id: payload?.timestamp || Date.now(),
		buttonText: payload?.buttonText || '',
		buttonSignature: payload?.buttonSignature || '',
		reason: payload?.reason || 'unknown',
		urlBefore: payload?.urlBefore || '',
		urlAfter: payload?.urlAfter || '',
		matchedKeyword: payload?.matchedKeyword || null,
		domChangePercent: typeof payload?.domChangePercent === 'number' ? payload.domChangePercent : null,
		timestamp: payload?.timestamp || Date.now()
	};
	jobBidStats.recent = [recentEvent, ...jobBidStats.recent].slice(0, MAX_RECENT_JOB_EVENTS);
	persistJobBidStats();
	broadcastJobBidStats();
}

function resetJobBidStats() {
	jobBidStats = { ...DEFAULT_JOB_BID_STATS };
	persistJobBidStats();
	broadcastJobBidStats();
}

function handleJobBidMessage(message) {
	switch (message?.action) {
		case 'jobBidApplied':
			recordJobBid(message.payload || {});
			return true;
		case 'jobBid:getStats':
			broadcastJobBidStats();
			return true;
		case 'jobBid:reset':
			resetJobBidStats();
			return true;
		default:
			return false;
	}
}

loadJobBidStats();

// Messages coming from content scripts that should be relayed to the extension UI
// Listen for messages from the UI and forward them to the content script or to backend
chrome.runtime.onMessage.addListener((message, sender/*, sendResponse*/) => {
	// UI -> background command: open multiple tabs (payload: { urls: [] })
	if (message.action === 'open-tabs') {
		const urls = message.payload && Array.isArray(message.payload.urls) ? message.payload.urls : [];
		if (!urls.length) return;
		for (const url of urls) {
			try {
				chrome.tabs.create({ url, active: false });
			} catch (e) {
				console.error('Failed to open tab for', url, e);
			}
		}
		return;
	}

	if (handleJobBidMessage(message)) {
		return;
	}

	if (actionsToForward.includes(message.action)) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]?.id) {
				const targetTabId = tabs[0].id;
				const sendToTopFrame = () => {
					chrome.tabs.sendMessage(targetTabId, message, { frameId: 0 }, () => {
						if (chrome.runtime.lastError) {
							// likely no listener in tab - inject content script then resend
							chrome.scripting.executeScript({
								target: { tabId: targetTabId },
								files: ["contentScript.js"],
							}, () => {
								// ignore errors; try sending again
								try { chrome.tabs.sendMessage(targetTabId, message, { frameId: 0 }); } catch (e) { console.error('Failed to send message after injecting contentScript', e); }
							});
						}
					});
				};
				sendToTopFrame();
			}
		});
		return;
	}

});
