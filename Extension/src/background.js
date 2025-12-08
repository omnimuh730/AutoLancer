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
