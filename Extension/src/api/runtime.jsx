import React, { useEffect, useRef } from 'react';
import RuntimeContext from './runtimeContext';

/* global chrome */
export const RuntimeProvider = ({ children }) => {
	const listenersRef = useRef(new Set());

	useEffect(() => {
		if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) return;

		// capture current set reference for cleanup safety
		const dispatcher = (message, sender, sendResponse) => {
			// Copy the listeners to an array to avoid issues if the set changes during iteration
			const listeners = Array.from(listenersRef.current);
			listeners.forEach((fn) => {
				try {
					fn(message, sender, sendResponse);
				} catch (e) {
					console.error('Runtime listener error:', e);
				}
			});
		};

		chrome.runtime.onMessage.addListener(dispatcher);

		return () => {
			try {
				chrome.runtime.onMessage.removeListener(dispatcher);
			} catch (e) {
				// ignore
				console.error('Error removing listener:', e);
			}
			// clear listeners
			listenersRef.current.clear();
		};
	}, []);

	const sendMessage = (message) => {
		if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
			console.warn('chrome.runtime.sendMessage not available');
			return;
		}
		chrome.runtime.sendMessage(message);
	};

	const addListener = (fn) => {
		listenersRef.current.add(fn);
	};

	const removeListener = (fn) => {
		listenersRef.current.delete(fn);
	};

	return (
		<RuntimeContext.Provider value={{ sendMessage, addListener, removeListener }}>
			{children}
		</RuntimeContext.Provider>
	);
};

export default RuntimeProvider;
