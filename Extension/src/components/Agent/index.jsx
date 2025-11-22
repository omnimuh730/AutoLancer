import { useCallback, useEffect, useState } from 'react';
import { useRuntime } from '../../api/runtimeContext';
import useApi from '../../api/useApi';
import { AgentUI } from './UI';
import { highlightInteractables, clearHighlights } from './api';

function AgentPage() {
	const { addListener, removeListener } = useRuntime();
	const [componentsData, setComponentsData] = useState(null);
	const [analysisData, setAnalysisData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);


	const spiritApi = useApi(import.meta.env.VITE_SPIRIT_API_URL || 'http://localhost:3001');

	const analyzeComponents = useCallback(async (payload) => {
		if (!payload) return;
		setLoading(true);
		setError(null);

		console.log('Sending analyze request with payload:', payload);

		try {
			const body = {
				userInput: JSON.stringify(payload, null, 2),
			};
			const result = await spiritApi.post('/analyze', body);
			setAnalysisData(result || null);
		} catch (e) {
			console.error('Analyze request failed:', e);
			setError(e?.data || e?.message || 'Analyze failed');
		} finally {
			setLoading(false);
		}
	}, [spiritApi]);

	useEffect(() => {
		const listener = (message) => {
			if (message?.action === 'interactablesResult') {
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
			setComponentsData(null);
			setAnalysisData(null);
			highlightInteractables();
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
