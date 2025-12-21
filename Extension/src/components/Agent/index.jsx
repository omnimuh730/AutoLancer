import { useCallback, useEffect, useRef, useState } from 'react';
import { useRuntime } from '../../api/runtimeContext';
import useApi from '../../api/useApi';
import { AgentUI } from './UI';
import { highlightInteractables, clearHighlights } from '../../contentScript/interactionBridge';

function AgentPage() {
	const { addListener, removeListener } = useRuntime();
	const [componentsData, setComponentsData] = useState(null);
	const [analysisData, setAnalysisData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const runIdRef = useRef(null);
	const lastHandledRunIdRef = useRef(null);


	const spiritApi = useApi(import.meta.env.VITE_SPIRIT_API_URL);
	const { post: spiritPost, baseUrl: spiritBaseUrl } = spiritApi;

	const analyzeComponents = useCallback(async (payload) => {
		if (!payload) return;
		if (!spiritBaseUrl) {
			setError('Spirit AI service is not configured. Please set VITE_SPIRIT_API_URL and reload.');
			setAnalysisData(null);
			return;
		}
		setLoading(true);
		setError(null);

		console.log('Sending analyze request with payload:', payload);

		try {
			const body = {
				userInput: JSON.stringify(payload, null, 2),
			};
			const result = await spiritPost('/analyze', body);
			setAnalysisData(result || null);
		} catch (e) {
			console.error('Analyze request failed:', e);
			setError(e?.data || e?.message || 'Analyze failed');
		} finally {
			setLoading(false);
		}
	}, [spiritBaseUrl, spiritPost]);

	useEffect(() => {
		const listener = (message) => {
			if (message?.action === 'interactablesResult') {
				const incomingRunId = message?.payload?.runId || null;
				// Normalize to current run when payload doesn't include the id (older content script)
				const normalizedRunId = incomingRunId || runIdRef.current || '__legacy__';
				if (lastHandledRunIdRef.current === normalizedRunId) return; // ignore duplicate
				lastHandledRunIdRef.current = normalizedRunId;

				setComponentsData(message.payload);
				// Kick off backend analysis
				analyzeComponents(message.payload);
			}
		};
		addListener(listener);
		return () => removeListener(listener);
	}, [addListener, removeListener, analyzeComponents]);

	const handleAnalyze = () => {
		try {
			const runId = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
			runIdRef.current = runId;
			lastHandledRunIdRef.current = null;
			setComponentsData(null);
			setAnalysisData(null);
			highlightInteractables(runId);
		} catch (e) {
			console.error('Analyze failed:', e);
		}
	};

	const handleClear = () => {
		try {
			clearHighlights();
		} catch (e) {
			console.error('Clear failed:', e);
		}
	};

	return (
		<AgentUI
			onAnalyze={handleAnalyze}
			onClear={handleClear}
			loading={loading}
			error={error}
			componentsData={componentsData}
			analysisData={analysisData}
		/>
	);
}

export default AgentPage;
