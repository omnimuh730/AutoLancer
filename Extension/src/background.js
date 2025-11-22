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

// Messages coming from content scripts that should be relayed to the extension UI
const relayToExtension = [
  "fetchResult",
  "coverageResult",
  "domHintsResult",
  "executionResult",
  "interactablesResult"
];

// Listen for messages from the UI and forward them to the content script or to backend
chrome.runtime.onMessage.addListener((message/*, sender, sendResponse*/) => {
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

	if (actionsToForward.includes(message.action)) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]?.id) {
				// Try to forward the message to the content script. If the content script
				// isn't present in the tab (e.g. extension loaded after tab), inject it
				// and retry once.
				chrome.tabs.sendMessage(tabs[0].id, message, () => {
					if (chrome.runtime.lastError) {
						// likely no listener in tab - inject content script then resend
						chrome.scripting.executeScript({
							target: { tabId: tabs[0].id },
							files: ["contentScript.js"],
						}, () => {
							// ignore errors; try sending again
							try { chrome.tabs.sendMessage(tabs[0].id, message); } catch (e) { console.error('Failed to send message after injecting contentScript', e); }
						});
					}
				});
			}
		});
		return;
	}

	// Relay messages coming from content scripts back to the extension (panel/UI)
	if (relayToExtension.includes(message.action)) {
		// Send a message to any open extension contexts - here we send to the runtime (panel)
		chrome.runtime.sendMessage({ action: message.action, payload: message.payload });
		return;
	}
});
