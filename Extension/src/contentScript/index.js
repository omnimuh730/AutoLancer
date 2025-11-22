import { messageHandler } from './messageHandler';

/* global chrome */

if (typeof window.contentScriptInjected === 'undefined') {
	window.contentScriptInjected = true;

	// Ensure we receive sender and sendResponse and return the boolean
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		try {
			return messageHandler(message, sender, sendResponse) === true;
		} catch (e) {
			console.error('contentScript onMessage error:', e);
			return false;
		}
	});
}
