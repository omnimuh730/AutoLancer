import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	Typography
} from '@mui/material';
import { useRuntime } from '../../api/runtimeContext';

const DEFAULT_STATS = {
	total: 0,
	recent: [],
	lastResetAt: null
};

const DEFAULT_STATUS = {
	state: 'idle',
	jobUrl: '',
	buttonCount: 0,
	buttons: [],
	buttonText: '',
	reason: '',
	matchedUrl: '',
	timestamp: null
};

const reasonLabelMap = {
	'dom-change': 'DOM change',
	'keyword': 'Keyword',
	'url-change': 'URL change'
};

function formatTimestamp(timestamp) {
	if (!timestamp) return '—';
	try {
		return new Date(timestamp).toLocaleString();
	} catch (e) {
		console.error('Failed to format timestamp', e);
		return '—';
	}
}

function formatUrl(url) {
	if (!url) return '';
	try {
		const parsed = new URL(url);
		return parsed.hostname + parsed.pathname;
	} catch (e) {
		console.error('Failed to format URL', e);
		return url;
	}
}

function StatusDetails({ status }) {
	const baseText = (() => {
		switch (status.state) {
			case 'buttons-found':
				return `Detected ${status.buttonCount} candidate button${status.buttonCount === 1 ? '' : 's'} on this page.`;
			case 'no-buttons':
				return 'No submit/apply buttons detected on this page.';
			case 'triggered':
				return `Detected a click on “${status.buttonText || 'unknown'}”, waiting for confirmation…`;
			case 'applied':
			case 'counted':
				return `Application counted (${status.reason || 'detected change'}).`;
			case 'duplicate':
				return status.matchedUrl
					? `Already applied earlier (matches ${formatUrl(status.matchedUrl)}).`
					: 'Already applied to this job earlier.';
			case 'not-counted':
				return `Interaction ended without confirmation (${status.reason || 'timeout'}).`;
			case 'idle':
			default:
				return 'Waiting for a page with apply/submit interactions.';
		}
	})();

	return (
		<Stack spacing={1}>
			<Typography variant="body1">{baseText}</Typography>
			{status.state === 'buttons-found' && status.buttons?.length ? (
				<Stack spacing={0.5}>
					{status.buttons.map((btn) => (
						<Typography key={btn.signature} variant="body2" color="text.secondary">
							• {btn.text || btn.tag || btn.signature}
						</Typography>
					))}
				</Stack>
			) : null}
			{status.jobUrl && (
				<Typography variant="caption" color="text.secondary">
					Page: {formatUrl(status.jobUrl)}
				</Typography>
			)}
			{status.state === 'duplicate' && status.matchedUrl && status.matchedUrl !== status.jobUrl && (
				<Typography variant="caption" color="text.secondary">
					Matched job: {formatUrl(status.matchedUrl)}
				</Typography>
			)}
		</Stack>
	);
}

export default function BidCounter() {
	const { addListener, removeListener, sendMessage } = useRuntime();
	const [stats, setStats] = useState(DEFAULT_STATS);
	const [duplicateAlert, setDuplicateAlert] = useState(null);
	const [status, setStatus] = useState(DEFAULT_STATUS);

	useEffect(() => {
		const listener = (message) => {
			if (message?.action === 'jobBidStats') {
				const payload = message.payload || DEFAULT_STATS;
				setStats({
					total: Number.isFinite(payload.total) ? payload.total : 0,
					recent: Array.isArray(payload.recent) ? payload.recent : [],
					lastResetAt: Number.isFinite(payload.lastResetAt) ? payload.lastResetAt : null
				});
			}

			if (message?.action === 'jobBidStatus:update') {
				const payload = message.payload || DEFAULT_STATUS;
				setStatus({
					state: payload.state || 'idle',
					jobUrl: payload.jobUrl || '',
					buttonCount: Number.isFinite(payload.buttonCount) ? payload.buttonCount : (payload.buttons?.length || 0),
					buttons: Array.isArray(payload.buttons) ? payload.buttons : [],
					buttonText: payload.buttonText || payload.button?.text || '',
					reason: payload.reason || '',
					matchedUrl: payload.matchedUrl || '',
					timestamp: payload.timestamp || Date.now()
				});
			}

			if (message?.action === 'jobBidDuplicate') {
				const payload = message.payload || {};
				setDuplicateAlert({
					jobUrl: payload.jobUrl || payload.matchedUrl || '',
					matchedUrl: payload.matchedUrl || '',
					buttonText: payload.buttonText || '',
					firstDetectedAt: payload.firstDetectedAt || null
				});
			}
		};
		addListener(listener);
		sendMessage({ action: 'jobBid:getStats' });
		sendMessage({ action: 'jobBidStatus:get' });
		return () => removeListener(listener);
	}, [addListener, removeListener, sendMessage]);

	useEffect(() => {
		if (!duplicateAlert) return;
		const timer = setTimeout(() => setDuplicateAlert(null), 8000);
		return () => clearTimeout(timer);
	}, [duplicateAlert]);

	const lastEvent = useMemo(() => stats.recent?.[0], [stats.recent]);

	const handleReset = () => {
		sendMessage({ action: 'jobBid:reset' });
	};

	return (
		<Stack spacing={3}>
			{duplicateAlert && (
				<Alert severity="info" onClose={() => setDuplicateAlert(null)}>
					You've already applied on {formatTimestamp(duplicateAlert.firstDetectedAt)} for {formatUrl(duplicateAlert.matchedUrl || duplicateAlert.jobUrl) || 'this job'}
					{duplicateAlert.buttonText ? ` (“${duplicateAlert.buttonText}”)` : ''}.
				</Alert>
			)}

			<Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
				<Stack spacing={1}>
					<Typography variant="h6">Live Status</Typography>
					<Typography variant="caption" color="text.secondary">
						Updated {formatTimestamp(status.timestamp)}
					</Typography>
					<StatusDetails status={status} />
				</Stack>
			</Paper>

			<Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
				<Stack spacing={2}>
					<Typography variant="h5">Job Bid Counter</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<Typography variant="h2">{stats.total}</Typography>
						<Box>
							<Typography variant="body2" color="text.secondary">
								Total detected submissions
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Last update: {formatTimestamp(lastEvent?.timestamp)}
							</Typography>
							{stats.lastResetAt && (
								<Typography variant="caption" color="text.secondary" display="block">
									Tracking since: {formatTimestamp(stats.lastResetAt)}
								</Typography>
							)}
						</Box>
					</Box>
					<Button variant="outlined" color="warning" onClick={handleReset} disabled={!stats.total}>
						Reset Counter
					</Button>
				</Stack>
			</Paper>

			<Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
				<Stack spacing={2}>
					<Typography variant="h6">Recent detections</Typography>
					{!stats.recent?.length && (
						<Typography variant="body2" color="text.secondary">
							No job submissions detected yet.
						</Typography>
					)}
					{stats.recent?.map((event) => (
						<Box key={event.id} sx={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1, p: 2 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									{event.buttonText || 'Unknown action'}
								</Typography>
								<Chip
									size="small"
									label={reasonLabelMap[event.reason] || event.reason || 'n/a'}
									variant="outlined"
									color="primary"
								/>
							</Stack>
							<Typography variant="body2" color="text.secondary">
								{event.jobUrl ? formatUrl(event.jobUrl) : (formatUrl(event.urlAfter) || formatUrl(event.urlBefore) || '—')}
							</Typography>
							<Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
								{typeof event.domChangePercent === 'number' && (
									<Typography variant="caption" color="text.secondary">
										Δ DOM: {(event.domChangePercent * 100).toFixed(1)}%
									</Typography>
								)}
								{event.matchedKeyword && (
									<Typography variant="caption" color="text.secondary">
										Keyword: {event.matchedKeyword}
									</Typography>
								)}
								<Typography variant="caption" color="text.secondary">
									Time: {formatTimestamp(event.timestamp)}
								</Typography>
							</Stack>
						</Box>
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}
