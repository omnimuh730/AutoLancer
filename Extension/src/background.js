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

const JOB_BID_STORAGE_KEY = 'jobBidStore';
const MAX_RECENT_JOB_EVENTS = 5;
const MAX_TRACKED_JOBS = 500;
const pendingStoreTasks = [];
let storeReady = false;

const createDefaultStore = () => ({
	stats: {
		total: 0,
		recent: []
	},
	jobs: {},
	lastResetAt: Date.now()
});

let jobBidStore = createDefaultStore();
let jobBidStatusState = {
	state: 'idle',
	jobUrl: '',
	timestamp: Date.now()
};

function normalizeStore(rawStore) {
	const defaults = createDefaultStore();
	if (!rawStore || typeof rawStore !== 'object') return defaults;

	const stats = rawStore.stats && typeof rawStore.stats === 'object' ? rawStore.stats : {};
	const normalizedStats = {
		total: Number.isFinite(stats.total) ? stats.total : 0,
		recent: Array.isArray(stats.recent) ? stats.recent.slice(0, MAX_RECENT_JOB_EVENTS) : []
	};

	const normalizedJobs = {};
	const rawJobs = rawStore.jobs && typeof rawStore.jobs === 'object' ? rawStore.jobs : {};
	for (const [key, value] of Object.entries(rawJobs)) {
		if (typeof value === 'number' && Number.isFinite(value)) {
			normalizedJobs[key] = value;
		}
	}
	const jobEntries = Object.entries(normalizedJobs).sort((a, b) => a[1] - b[1]);
	const trimmedJobs = jobEntries.length > MAX_TRACKED_JOBS
		? Object.fromEntries(jobEntries.slice(jobEntries.length - MAX_TRACKED_JOBS))
		: normalizedJobs;

	const lastResetAt = Number.isFinite(rawStore.lastResetAt) ? rawStore.lastResetAt : defaults.lastResetAt;

	return {
		stats: normalizedStats,
		jobs: trimmedJobs,
		lastResetAt
	};
}

function persistJobBidStore() {
	try {
		chrome.storage?.local?.set({ [JOB_BID_STORAGE_KEY]: jobBidStore }, () => {
			if (chrome.runtime.lastError) {
				console.error('Failed to persist job bid store', chrome.runtime.lastError);
			}
		});
	} catch (e) {
		console.error('Error persisting job bid store', e);
	}
}

function broadcastJobBidStats() {
	const payload = {
		total: jobBidStore.stats.total,
		recent: jobBidStore.stats.recent,
		lastResetAt: jobBidStore.lastResetAt
	};
	try {
		chrome.runtime.sendMessage({ action: 'jobBidStats', payload });
	} catch (e) {
		console.error('Failed to broadcast job bid stats', e);
	}
}

function broadcastJobBidStatusState() {
	try {
		chrome.runtime.sendMessage({ action: 'jobBidStatus:update', payload: jobBidStatusState });
	} catch (e) {
		console.error('Failed to broadcast job bid status', e);
	}
}

function updateJobBidStatus(nextState) {
	jobBidStatusState = {
		...jobBidStatusState,
		...nextState,
		timestamp: nextState?.timestamp || Date.now()
	};
	broadcastJobBidStatusState();
}

function normalizeJobUrl(jobUrl) {
	if (!jobUrl || typeof jobUrl !== 'string') return null;
	try {
		const parsed = new URL(jobUrl);
		parsed.hash = '';
		parsed.search = '';
		return parsed.toString();
	} catch (e) {
		return jobUrl.trim() || null;
	}
}

function notifyDuplicate(jobUrl, buttonText, firstDetectedAt) {
	const payload = {
		jobUrl: jobUrl || '',
		buttonText: buttonText || '',
		firstDetectedAt,
		againDetectedAt: Date.now()
	};
	try {
		chrome.runtime.sendMessage({ action: 'jobBidDuplicate', payload });
	} catch (e) {
		console.error('Failed to broadcast duplicate job bid notice', e);
	}
	updateJobBidStatus({
		state: 'duplicate',
		jobUrl: jobUrl || '',
		buttonText: buttonText || '',
		firstDetectedAt
	});
}

function enforceJobLimit() {
	const jobEntries = Object.entries(jobBidStore.jobs);
	if (jobEntries.length <= MAX_TRACKED_JOBS) return;
	jobEntries.sort((a, b) => a[1] - b[1]);
	jobBidStore.jobs = Object.fromEntries(jobEntries.slice(jobEntries.length - MAX_TRACKED_JOBS));
}

function withStoreReady(task) {
	if (storeReady) {
		task();
		return;
	}
	pendingStoreTasks.push(task);
}

function flushPendingStoreTasks() {
	if (!pendingStoreTasks.length) return;
	const tasks = pendingStoreTasks.splice(0, pendingStoreTasks.length);
	for (const task of tasks) {
		try {
			task();
		} catch (e) {
			console.error('Pending store task failed', e);
		}
	}
}

function recordJobBid(payload) {
	withStoreReady(() => {
		const timestamp = payload?.timestamp || Date.now();
		const jobUrl = payload?.jobUrl || payload?.urlBefore || payload?.urlAfter || '';
		const jobKey = normalizeJobUrl(jobUrl);

		if (jobKey && jobBidStore.jobs[jobKey]) {
			notifyDuplicate(jobUrl, payload?.buttonText, jobBidStore.jobs[jobKey]);
			return;
		}

		if (jobKey) {
			jobBidStore.jobs[jobKey] = timestamp;
			enforceJobLimit();
		}

		jobBidStore.stats.total += 1;
		const recentEvent = {
			id: timestamp,
			buttonText: payload?.buttonText || '',
			buttonSignature: payload?.buttonSignature || '',
			reason: payload?.reason || 'unknown',
			jobUrl: jobUrl,
			urlBefore: payload?.urlBefore || '',
			urlAfter: payload?.urlAfter || '',
			matchedKeyword: payload?.matchedKeyword || null,
			domChangePercent: typeof payload?.domChangePercent === 'number' ? payload.domChangePercent : null,
			timestamp
		};
		jobBidStore.stats.recent = [recentEvent, ...jobBidStore.stats.recent].slice(0, MAX_RECENT_JOB_EVENTS);
		persistJobBidStore();
		broadcastJobBidStats();
		updateJobBidStatus({
			state: 'counted',
			jobUrl,
			buttonText: payload?.buttonText || ''
		});
	});
}

function resetJobBidStats() {
	withStoreReady(() => {
		jobBidStore = createDefaultStore();
		persistJobBidStore();
		broadcastJobBidStats();
		updateJobBidStatus({ state: 'idle', jobUrl: '' });
	});
}

function loadJobBidStore() {
	try {
		chrome.storage?.local?.get(JOB_BID_STORAGE_KEY, (items) => {
			if (chrome.runtime.lastError) {
				console.error('Failed to read job bid store', chrome.runtime.lastError);
				jobBidStore = createDefaultStore();
				persistJobBidStore();
				storeReady = true;
				flushPendingStoreTasks();
				broadcastJobBidStats();
				broadcastJobBidStatusState();
				return;
			}
			const stored = items?.[JOB_BID_STORAGE_KEY];
			if (!stored) {
				jobBidStore = createDefaultStore();
				persistJobBidStore();
				storeReady = true;
				flushPendingStoreTasks();
				broadcastJobBidStats();
				broadcastJobBidStatusState();
				return;
			}
			jobBidStore = normalizeStore(stored);
			storeReady = true;
			flushPendingStoreTasks();
			broadcastJobBidStats();
			broadcastJobBidStatusState();
		});
	} catch (e) {
		console.error('Error loading job bid store', e);
		jobBidStore = createDefaultStore();
		storeReady = true;
		flushPendingStoreTasks();
		broadcastJobBidStats();
		broadcastJobBidStatusState();
	}
}

function handleJobBidMessage(message) {
	switch (message?.action) {
		case 'jobBidApplied':
			recordJobBid(message.payload || {});
			return true;
		case 'jobBidStatus':
			updateJobBidStatus(message.payload || {});
			return true;
		case 'jobBidStatus:get':
			broadcastJobBidStatusState();
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

loadJobBidStore();

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
