import { Button, Paper, Box, Stack, Typography, TextField } from '@mui/material';
import ResponseTreeView from './reference/ResponseTreeView.jsx';

export function AgentUI({
	onAnalyze,
	onClear,
	onExecute,
	loading,
	executing,
	error,
	jobDescription,
	onJobDescriptionChange,
	componentsData,
	analysisData,
	hasExecutableActions
}) {
	return (
		<Box sx={{ p: 2, maxWidth: 1000, margin: 'auto' }}>
			<Paper elevation={2} sx={{ p: 2, mb: 2 }}>
				<Stack spacing={2}>
					<Typography variant="h5">Agent</Typography>
					<TextField
						label="Job Description (optional)"
						placeholder="Paste the job description here to improve AI answers"
						value={jobDescription}
						onChange={(e) => onJobDescriptionChange?.(e.target.value)}
						multiline
						minRows={4}
						fullWidth
					/>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button variant="contained" color="primary" onClick={onAnalyze} fullWidth>
							Highlight & Collect
						</Button>
						<Button variant="outlined" color="secondary" onClick={onClear} fullWidth>
							Clear Highlights
						</Button>
						<Button variant="contained" color="success" onClick={onExecute} fullWidth disabled={!hasExecutableActions || loading || executing}>
							{executing ? 'Executing...' : 'Execute Actions'}
						</Button>
					</Box>
					{loading && <Typography variant="body2">Analyzing with AI...</Typography>}
					{executing && <Typography variant="body2">Filling text fields...</Typography>}
					{error && (
						<Typography variant="body2" color="error">
							{String(error)}
						</Typography>
					)}
				</Stack>
			</Paper>

			{componentsData && (
				<Paper elevation={1} sx={{ p: 2, mb: 2 }}>
					<Typography variant="subtitle1" sx={{ mb: 1 }}>Detected Components</Typography>
					<ResponseTreeView data={componentsData} />
				</Paper>
			)}

			{analysisData && (
				<Paper elevation={1} sx={{ p: 2 }}>
					<Typography variant="subtitle1" sx={{ mb: 1 }}>AI Analysis</Typography>
					<ResponseTreeView data={analysisData} />
				</Paper>
			)}
		</Box>
	);
}
