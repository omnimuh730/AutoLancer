import { messageHandler } from './messageHandler';
import { initJobBidMonitor } from './jobBidMonitor';
import { enableAutolancerInputEffects } from './inputEffects';

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

	try {
		initJobBidMonitor();
	} catch (e) {
		console.error('Failed to boot job bid monitor', e);
	}

	try {
		enableAutolancerInputEffects();
	} catch (e) {
		console.error('Failed to enable input effects', e);
	}
}
