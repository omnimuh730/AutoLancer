import { useEffect, useMemo, useState } from 'react';
import {
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
	recent: []
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
		return '—';
	}
}

function formatUrl(url) {
	if (!url) return '';
	try {
		const parsed = new URL(url);
		return parsed.hostname + parsed.pathname;
	} catch (e) {
		return url;
	}
}

export default function BidCounter() {
	const { addListener, removeListener, sendMessage } = useRuntime();
	const [stats, setStats] = useState(DEFAULT_STATS);

	useEffect(() => {
		const listener = (message) => {
			if (message?.action === 'jobBidStats') {
				const payload = message.payload || DEFAULT_STATS;
				setStats({
					total: Number.isFinite(payload.total) ? payload.total : 0,
					recent: Array.isArray(payload.recent) ? payload.recent : []
				});
			}
		};
		addListener(listener);
		sendMessage({ action: 'jobBid:getStats' });
		return () => removeListener(listener);
	}, [addListener, removeListener, sendMessage]);

	const lastEvent = useMemo(() => stats.recent?.[0], [stats.recent]);

	const handleReset = () => {
		sendMessage({ action: 'jobBid:reset' });
	};

	return (
		<Stack spacing={3}>
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
								{event.urlAfter ? formatUrl(event.urlAfter) : formatUrl(event.urlBefore) || '—'}
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
