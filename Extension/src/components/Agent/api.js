/* global chrome */

export const highlightInteractables = () => {
	chrome.runtime.sendMessage({ action: 'highlightInteractables' });
};

export const clearHighlights = () => {
	chrome.runtime.sendMessage({ action: 'clearHighlight' });
};

