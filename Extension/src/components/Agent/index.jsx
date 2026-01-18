import { useCallback, useEffect, useRef, useState } from 'react';
import { useRuntime } from '../../api/runtimeContext';
import useApi from '../../api/useApi';
import { AgentUI } from './UI';
import { highlightInteractables, clearHighlights, executeActionsSequence } from '../../contentScript/interactionBridge';
import { useAgentState } from './hooks';

function AgentPage() {
	const { addListener, removeListener } = useRuntime();
	const [componentsData, setComponentsData] = useState(null);
	const [analysisData, setAnalysisData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [executing, setExecuting] = useState(false);
	const [error, setError] = useState(null);
	const runIdRef = useRef(null);
	const lastHandledRunIdRef = useRef(null);

	const { executableActions, setExecutableActions } = useAgentState();

	const spiritApi = useApi(import.meta.env.VITE_SPIRIT_API_URL);
	const { post: spiritPost, baseUrl: spiritBaseUrl } = spiritApi;

	const deriveSelectorFromSerializedElement = useCallback((serializedElement) => {
		const tag = serializedElement?.tag;
		const props = serializedElement?.properties || {};
		if (!tag) return null;

		if (props.id) return { componentType: tag, propertyName: 'id', pattern: props.id };
		if (props.name) return { componentType: tag, propertyName: 'name', pattern: props.name };

		if (tag === 'input' && props.value) {
			const inputType = String(props.type || '').toLowerCase();
			if (['radio', 'checkbox', 'button', 'submit'].includes(inputType)) {
				return { componentType: tag, propertyName: 'value', pattern: props.value };
			}
		}

		if (props['data-testid']) return { componentType: tag, propertyName: 'data-testid', pattern: props['data-testid'] };
		if (props['data-cy']) return { componentType: tag, propertyName: 'data-cy', pattern: props['data-cy'] };
		if (props['data-automation-id']) return { componentType: tag, propertyName: 'data-automation-id', pattern: props['data-automation-id'] };
		if (props['aria-label']) return { componentType: tag, propertyName: 'aria-label', pattern: props['aria-label'] };
		if (props.placeholder) return { componentType: tag, propertyName: 'placeholder', pattern: props.placeholder };

		const classAttr = props.class || '';
		const firstClass = String(classAttr).split(/\s+/).filter(Boolean)[0];
		if (firstClass) return { componentType: tag, propertyName: 'class', pattern: `?${firstClass}?` };

		return null;
	}, []);

	const pickChildFromGroup = useCallback((group, command, childIndex) => {
		const children = Array.isArray(group?.Children) ? group.Children : [];
		const idx = Number.isFinite(childIndex) ? childIndex : parseInt(childIndex, 10);

		if (Number.isFinite(idx) && idx >= 0 && idx < children.length) return children[idx];

		if (command === 'TYPING') {
			return children.find((c) => c?.tag === 'input' || c?.tag === 'textarea') || null;
		}
		if (command === 'SELECT_OPTION' || command === 'DROPDOWN_SELECT') {
			return children.find((c) => c?.tag === 'select') || null;
		}
		if (command === 'CLICK') {
			return children.find((c) => c?.tag === 'button' || c?.tag === 'a' || (c?.tag === 'input' && (c?.properties?.type === 'button' || c?.properties?.type === 'submit'))) || null;
		}
		if (command === 'UPLOAD' || command === 'FILEUPLOAD') {
			return children.find((c) => c?.tag === 'input' && c?.properties?.type === 'file') || null;
		}

		return null;
	}, []);

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
		setExecuting(false);

		console.log('Sending analyze request with payload:', payload);

		try {
			const body = {
				userInput: JSON.stringify(payload, null, 2),
			};
			const result = await spiritPost('/analyze', body);
			setAnalysisData(result || null);

			console.log('Analyze result:', result);

			if (Array.isArray(result?.payload) && Array.isArray(payload?.components)) {
				const actions = [];
				for (let i = 0; i < result.payload.length; i++) {
					const item = result.payload[i];
					const group = payload.components[i];
					if (!group) continue;

					const suggestion = item?.action_suggestion || item?.insights?.action_suggestion || null;
					const command = suggestion?.command || null;
					if (!command) continue;
					if (command === 'ERROR' || command === 'MANUAL_INTERVENTION') continue;

					const childIndex = suggestion?.payload?.childIndex;
					const targetSerializedElement = pickChildFromGroup(group, command, childIndex);
					if (!targetSerializedElement) continue;

					const selector = deriveSelectorFromSerializedElement(targetSerializedElement);
					if (!selector?.pattern) continue;

					if (command === 'TYPING') {
						const value = suggestion?.payload?.value;
						if (!value) continue;
						actions.push({ ...selector, order: 0, action: 'typeSmoothly', value });
					} else if (command === 'CLICK') {
						actions.push({ ...selector, order: 0, action: 'click' });
					} else if (command === 'SELECT_OPTION' || command === 'DROPDOWN_SELECT') {
						const selectionValue = suggestion?.payload?.selectionValue ?? suggestion?.payload?.value;
						if (!selectionValue) continue;
						actions.push({ ...selector, order: 0, action: 'selectByText', value: selectionValue });
					} else if (command === 'UPLOAD' || command === 'FILEUPLOAD') {
						actions.push({ ...selector, order: 0, action: 'click' });
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
	}, [deriveSelectorFromSerializedElement, pickChildFromGroup, spiritBaseUrl, spiritPost, setExecutableActions]);


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
			} else if (message?.action === 'executeActionsSequenceResult') {
				const runId = message?.payload?.runId || null;
				const isCurrentRun = !runId || runId === runIdRef.current;
				if (isCurrentRun) setExecuting(false);
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
			setExecuting(false);
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
		if (executing) return;

		setExecuting(true);
		console.log('Executing actions:', executableActions);
		executeActionsSequence(executableActions, runIdRef.current);
	};

	const hasExecutableActions = executableActions.length > 0;

	return (
		<AgentUI
			onAnalyze={handleAnalyze}
			onClear={handleClear}
			onExecute={handleExecute}
			loading={loading}
			executing={executing}
			error={error}
			componentsData={componentsData}
			analysisData={analysisData}
			hasExecutableActions={hasExecutableActions}
		/>
	);
}

export default AgentPage;
