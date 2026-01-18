import { useCallback, useEffect, useRef, useState } from 'react';
import { useRuntime } from '../../api/runtimeContext';
import useApi from '../../api/useApi';
import { AgentUI } from './UI';
import { highlightInteractables, clearHighlights, handleAction } from '../../contentScript/interactionBridge';
import { useAgentState } from './hooks';

function AgentPage() {
	const { addListener, removeListener } = useRuntime();
	const [componentsData, setComponentsData] = useState(null);
	const [analysisData, setAnalysisData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const runIdRef = useRef(null);
	const lastHandledRunIdRef = useRef(null);

	const { executableActions, setExecutableActions } = useAgentState();

	const spiritApi = useApi(import.meta.env.VITE_SPIRIT_API_URL);
	const { post: spiritPost, baseUrl: spiritBaseUrl } = spiritApi;

	const analyzeComponents = useCallback(async (payload) => {
		if (!payload) return;
		if (!spiritBaseUrl) {
			setError('Spirit AI service is not configured. Please set VITE_SPIRIT_API_URL and reload.');
			setAnalysisData(null);
			setExecutableActions([]);
			return;
		}
		setLoading(true);
		setError(null);
		setExecutableActions([]);

		console.log('Sending analyze request with payload:', payload);

		try {
			const body = {
				userInput: JSON.stringify(payload, null, 2),
			};
			const result = await spiritPost('/analyze', body);
			setAnalysisData(result || null);

			console.log('Analyze result:', result);

			if (result?.payload) {
				const actions = [];
				for (const item of result.payload) {
					if (item.insights?.actionComponent && item.insights?.action_suggestion?.command === 'TYPING' && item.insights?.action_suggestion?.payload?.value) {
						const component = item.insights.actionComponent[0];
						let property = '';
						let pattern = '';
						if (component.id) {
							property = 'id';
							pattern = component.id;
						} else if (component.name) {
							property = 'name';
							pattern = component.name;
						} else if (component.className) {
							property = 'class';
							pattern = component.className.split(' ')[0];
						} else {
							property = 'tag';
							pattern = '';
						}

						if (component.tag && pattern) {
							actions.push({
								tag: component.tag,
								property: property,
								pattern: pattern,
								order: 0,
								action: 'fill',
								actionValue: item.insights.action_suggestion.payload.value,
								fetchType: null,
								identifier: null,
							});
						}
					}
				}
				setExecutableActions(actions);
			}
		} catch (e) {
			console.error('Analyze request failed:', e);
			setError(e?.data || e?.message || 'Analyze failed');
		} finally {
			setLoading(false);
		}
	}, []);


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
			setExecutableActions([]);
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

	const handleExecute = () => {
		if (!executableActions.length) return;
		console.log('Executing actions:', executableActions);
		executableActions.forEach(action => {
			handleAction(action.tag, action.property, action.pattern, action.order, action.action, action.actionValue, action.fetchType, action.identifier);
		});
	};

	const hasExecutableActions = executableActions.length > 0;

	return (
		<AgentUI
			onAnalyze={handleAnalyze}
			onClear={handleClear}
			onExecute={handleExecute}
			loading={loading}
			error={error}
			componentsData={componentsData}
			analysisData={analysisData}
			hasExecutableActions={hasExecutableActions}
		/>
	);
}

export default AgentPage;