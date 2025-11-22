import React, { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Stack,
	Typography,
	TextField,
	Select,
	MenuItem,
	Button,
	IconButton,
	Paper,
	Divider,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField as DialogTextField,
	Chip,
	List,
	ListItem,
	ListItemText,
	DialogContentText,
	CircularProgress,
} from '@mui/material';
import { Add, Delete, Search, Edit } from '@mui/icons-material';
import useApi from '../../api/useApi';

const FIELD_OPTIONS = [
	{ value: 'companyName', label: 'Company Name' },
	{ value: 'title', label: 'Job Title' },
];
const OPERATOR_OPTIONS = [
	{ value: 'equals', label: 'Equals' },
	{ value: 'contains', label: 'Contains' },
	{ value: 'pattern', label: 'Pattern' },
];
const LOGICAL_OPERATORS = ['AND', 'OR', 'XOR', 'NOR'];

const getJobId = (job) => {
	if (!job) return null;
	const candidate = job._id ?? job.id;
	if (!candidate) return null;
	if (typeof candidate === 'object' && candidate.$oid) {
		return candidate.$oid;
	}
	return String(candidate);
};

// Initial rule structure
const createNewRule = () => ({
	id: Date.now(),
	field: FIELD_OPTIONS[0].value,
	operator: OPERATOR_OPTIONS[0].value,
	value: '',
});

export default function RuleSettingsPage() {
	const [savedRules, setSavedRules] = useState([]);
	const [rules, setRules] = useState([createNewRule()]);
	const [logicalOperators, setLogicalOperators] = useState(['AND']);
	const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
	const [newRuleName, setNewRuleName] = useState('');
	const [isSearchDialogOpen, setSearchDialogOpen] = useState(false);
	const [searchResult, setSearchResult] = useState({ name: '', jobs: [], message: '', rule: null });
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);
	const [isRemovingJobs, setIsRemovingJobs] = useState(false);
	const { get, post, request } = useApi();

	const [isEditDialogOpen, setEditDialogOpen] = useState(false);
	const [editingRule, setEditingRule] = useState(null);
	const [editedRules, setEditedRules] = useState([]);
	const [editedLogicalOperators, setEditedLogicalOperators] = useState([]);
	const [editedRuleName, setEditedRuleName] = useState('');

	const fetchSavedRules = useCallback(async () => {
		try {
			const fetchedRules = await get('/rules');
			setSavedRules(Array.isArray(fetchedRules) ? fetchedRules : []);
		} catch (error) {
			console.error('Failed to fetch rules', error);
		}
	}, [get]);

	useEffect(() => {
		fetchSavedRules();
	}, [fetchSavedRules]);

	const handleRuleChange = (index, key, value) => {
		const newRules = [...rules];
		newRules[index][key] = value;
		setRules(newRules);
	};

	const handleAddRule = () => {
		setRules([...rules, createNewRule()]);
		if (rules.length > 0) {
			setLogicalOperators([...logicalOperators, 'AND']);
		}
	};

	const handleRemoveRule = (index) => {
		if (rules.length === 1) return; // Cannot remove the last rule
		const newRules = rules.filter((_, i) => i !== index);
		setRules(newRules);

		const newLogicalOperators = [...logicalOperators];
		newLogicalOperators.splice(index - 1, 1);
		setLogicalOperators(newLogicalOperators);
	};

	const handleLogicalOperatorChange = (index, value) => {
		const newOperators = [...logicalOperators];
		newOperators[index] = value;
		setLogicalOperators(newOperators);
	};

	const handleOpenSaveDialog = () => {
		setSaveDialogOpen(true);
	};

	const handleCloseSaveDialog = () => {
		setSaveDialogOpen(false);
		setNewRuleName('');
	};

	const handleSaveRule = async () => {
		if (newRuleName.trim() === '') return;

		const newSavedRule = {
			name: newRuleName,
			rules: rules.map(({ field, operator, value }) => ({ field, operator, value })), // Clean up rule objects
			logicalOperators: logicalOperators.slice(0, rules.length - 1),
		};

		try {
			await post('/rules', newSavedRule);
			await fetchSavedRules();
			handleCloseSaveDialog();
			// Reset the editor
			setRules([createNewRule()]);
			setLogicalOperators(['AND']);
		} catch (error) {
			console.error('Failed to save rule', error);
		}
	};

	const handleDeleteRule = async (ruleNameToDelete) => {
		try {
			const encodedName = encodeURIComponent(ruleNameToDelete);
			await request(`/rules/${encodedName}`, { method: 'DELETE' });
			setSavedRules(savedRules.filter((rule) => rule.name !== ruleNameToDelete));
		} catch (error) {
			console.error('Failed to delete rule', error);
		}
	};

	const handleSearchRule = async (ruleName) => {
		setIsLoadingSearch(true);
		setSearchDialogOpen(true);
		const rule = savedRules.find((r) => r.name === ruleName);
		setSearchResult({ name: ruleName, jobs: [], message: '', rule });
		try {
			const response = await get(`/jobs/rule/${encodeURIComponent(ruleName)}`);
			setSearchResult({
				name: ruleName,
				jobs: response.data || [],
				message: response.message || '',
				rule,
			});
		} catch (error) {
			console.error('Failed to search for jobs by rule', error);
			setSearchResult({
				name: ruleName,
				jobs: [],
				message: 'Failed to fetch jobs. Please try again.',
				rule,
			});
		} finally {
			setIsLoadingSearch(false);
		}
	};

	const handleCloseSearchDialog = () => {
		setSearchDialogOpen(false);
		setSearchResult({ name: '', jobs: [], message: '', rule: null });
	};

	const handleRemoveAllSearchJobs = async () => {
		if (!searchResult.name || isRemovingJobs) return;

		try {
			setIsRemovingJobs(true);
			const encodedName = encodeURIComponent(searchResult.name);
			const response = await request(`/jobs/rule/${encodedName}`, { method: 'DELETE' });
			if (response?.success) {
				setSearchResult((prev) => ({
					...prev,
					jobs: [],
					message: `Removed ${response.deletedCount || 0} job(s) for this rule.`,
				}));
			} else {
				setSearchResult((prev) => ({
					...prev,
					message: response?.error || 'Failed to remove jobs. Please try again.',
				}));
			}
		} catch (error) {
			console.error('Failed to remove jobs for rule', error);
			setSearchResult((prev) => ({
				...prev,
				message: 'Failed to remove jobs. Please try again.',
			}));
		} finally {
			setIsRemovingJobs(false);
		}
	};

	const formatRuleLogic = (rule) => {
		if (!rule || !rule.rules) return '';
		const { rules, logicalOperators } = rule;
		return rules
			.map((r, index) => {
				const fieldLabel = FIELD_OPTIONS.find((f) => f.value === r.field)?.label || r.field;
				const operatorLabel = OPERATOR_OPTIONS.find((o) => o.value === r.operator)?.label || r.operator;
				const ruleString = `(${fieldLabel} ${operatorLabel} "${r.value}")`;
				if (index < rules.length - 1) {
					return `${ruleString} ${logicalOperators[index] || ''}`;
				}
				return ruleString;
			})
			.join(' ');
	};

	const handleOpenEditDialog = (rule) => {
		setEditingRule(rule);
		setEditedRuleName(rule.name);
		setEditedRules(rule.rules.map((r) => ({ ...r, id: Date.now() + Math.random() })));
		setEditedLogicalOperators(rule.logicalOperators || []);
		setEditDialogOpen(true);
	};

	const handleCloseEditDialog = () => {
		setEditDialogOpen(false);
		setEditingRule(null);
		setEditedRuleName('');
		setEditedRules([]);
		setEditedLogicalOperators([]);
	};

	const handleUpdateRule = async () => {
		if (!editingRule) return;

		const updatedRule = {
			name: editedRuleName,
			rules: editedRules.map(({ field, operator, value }) => ({ field, operator, value })),
			logicalOperators: editedLogicalOperators.slice(0, editedRules.length - 1),
		};

		try {
			const encodedName = encodeURIComponent(editingRule.name);
			await request(`/rules/${encodedName}`, {
				method: 'PUT',
				body: updatedRule,
			});

			await fetchSavedRules();
			handleCloseEditDialog();
		} catch (error) {
			console.error('Failed to update rule', error);
		}
	};

	const handleEditedRuleChange = (index, key, value) => {
		const newRules = [...editedRules];
		newRules[index][key] = value;
		setEditedRules(newRules);
	};

	const handleAddEditedRule = () => {
		setEditedRules([...editedRules, createNewRule()]);
		if (editedRules.length > 0) {
			setEditedLogicalOperators([...editedLogicalOperators, 'AND']);
		}
	};

	const handleRemoveEditedRule = (index) => {
		if (editedRules.length === 1) return;
		const newRules = editedRules.filter((_, i) => i !== index);
		setEditedRules(newRules);

		const newLogicalOperators = [...editedLogicalOperators];
		newLogicalOperators.splice(index - 1, 1);
		setEditedLogicalOperators(newLogicalOperators);
	};

	const handleEditedLogicalOperatorChange = (index, value) => {
		const newOperators = [...editedLogicalOperators];
		newOperators[index] = value;
		setEditedLogicalOperators(newOperators);
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" gutterBottom>
				Saved Rules
			</Typography>
			<Paper elevation={2} sx={{ p: 2, mb: 4 }}>
				{savedRules.length === 0 ? (
					<Typography>No rules saved yet.</Typography>
				) : (
					<Stack spacing={1}>
						{savedRules.map((savedRule) => (
							<Stack direction="row" spacing={1} alignItems="center" key={savedRule.name}>
								<Chip label={savedRule.name} onDelete={() => handleDeleteRule(savedRule.name)} />
								<IconButton onClick={() => handleSearchRule(savedRule.name)} size="small">
									<Search />
								</IconButton>
								<IconButton onClick={() => handleOpenEditDialog(savedRule)} size="small">
									<Edit />
								</IconButton>
							</Stack>
						))}
					</Stack>
				)}
			</Paper>

			<Typography variant="h5" gutterBottom>
				Create New Rule
			</Typography>
			<Paper elevation={2} sx={{ p: 3 }}>
				<Stack spacing={2}>
					{rules.map((rule, index) => (
						<React.Fragment key={rule.id}>
							{index > 0 && (
								<Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
									<Select
										value={logicalOperators[index - 1]}
										onChange={(e) => handleLogicalOperatorChange(index - 1, e.target.value)}
										size="small"
										sx={{ width: '100px' }}
									>
										{LOGICAL_OPERATORS.map((op) => (
											<MenuItem key={op} value={op}>
												{op}
											</MenuItem>
										))}
									</Select>
									<Divider sx={{ flexGrow: 1, ml: 2 }} />
								</Box>
							)}
							<Stack direction="row" spacing={2} alignItems="center">
								<Select
									value={rule.field}
									onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
									size="small"
									sx={{ width: '200px' }}
								>
									{FIELD_OPTIONS.map((opt) => (
										<MenuItem key={opt.value} value={opt.value}>
											{opt.label}
										</MenuItem>
									))}
								</Select>
								<Select
									value={rule.operator}
									onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
									size="small"
									sx={{ width: '150px' }}
								>
									{OPERATOR_OPTIONS.map((opt) => (
										<MenuItem key={opt.value} value={opt.value}>
											{opt.label}
										</MenuItem>
									))}
								</Select>
								<TextField
									label="Value"
									variant="outlined"
									size="small"
									value={rule.value}
									onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
									sx={{ flexGrow: 1 }}
								/>
								<IconButton onClick={() => handleRemoveRule(index)} disabled={rules.length === 1} color="error">
									<Delete />
								</IconButton>
							</Stack>
						</React.Fragment>
					))}
				</Stack>
				<Button startIcon={<Add />} onClick={handleAddRule} sx={{ mt: 2 }}>
					Add Rule
				</Button>
				<Divider sx={{ my: 3 }} />
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button variant="contained" color="primary" onClick={handleOpenSaveDialog}>
						Save Rule Set
					</Button>
					.
				</Box>
			</Paper>

			{/* Save Rule Dialog */}
			<Dialog open={isSaveDialogOpen} onClose={handleCloseSaveDialog}>
				<DialogTitle>Save Rule Set</DialogTitle>
				<DialogContent>
					<DialogTextField
						autoFocus
						margin="dense"
						label="Rule Name"
						type="text"
						fullWidth
						variant="standard"
						value={newRuleName}
						onChange={(e) => setNewRuleName(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseSaveDialog}>Cancel</Button>
					<Button onClick={handleSaveRule} variant="contained">
						Save
					</Button>
				</DialogActions>
			</Dialog>

			{/* Search Results Dialog */}
			<Dialog open={isSearchDialogOpen} onClose={handleCloseSearchDialog} fullWidth maxWidth="md">
				<DialogTitle>Search Results for "{searchResult.name}"</DialogTitle>
				<DialogContent>
					{searchResult.rule && (
						<Paper elevation={2} sx={{ p: 2, mb: 2 }}>
							<Typography variant="h6" gutterBottom>
								Rule Logic
							</Typography>
							<Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>{formatRuleLogic(searchResult.rule)}</Typography>
						</Paper>
					)}
					{isLoadingSearch ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
							<CircularProgress />
						</Box>
					) : (
						<>
							{searchResult.message && <DialogContentText sx={{ mb: 2 }}>{searchResult.message}</DialogContentText>}
							{searchResult.jobs.length === 0 ? (
								<Typography>No matching jobs found.</Typography>
							) : (
								<List dense>
									{searchResult.jobs.map((job) => (
										<ListItem key={getJobId(job) || job._id}>
											<ListItemText primary={job.title} secondary={job.company?.name || 'N/A'} />
										</ListItem>
									))}
								</List>
							)}
						</>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleRemoveAllSearchJobs} color="error" disabled={isRemovingJobs || !searchResult.name}>
						{isRemovingJobs ? 'Removing...' : 'Remove All'}
					</Button>
					<Button onClick={handleCloseSearchDialog}>Close</Button>
				</DialogActions>
			</Dialog>
			{/* Edit Rule Dialog */}
			<Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="lg">
				<DialogTitle>Edit Rule: {editingRule?.name}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 2 }}>
						<TextField
							label="Rule Name"
							value={editedRuleName}
							onChange={(e) => setEditedRuleName(e.target.value)}
							variant="outlined"
							size="small"
						/>
						{editedRules.map((rule, index) => (
							<React.Fragment key={rule.id}>
								{index > 0 && (
									<Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
										<Select
											value={editedLogicalOperators[index - 1]}
											onChange={(e) => handleEditedLogicalOperatorChange(index - 1, e.target.value)}
											size="small"
											sx={{ width: '100px' }}
										>
											{LOGICAL_OPERATORS.map((op) => (
												<MenuItem key={op} value={op}>
													{op}
												</MenuItem>
											))}
										</Select>
										<Divider sx={{ flexGrow: 1, ml: 2 }} />
									</Box>
								)}
								<Stack direction="row" spacing={2} alignItems="center">
									<Select
										value={rule.field}
										onChange={(e) => handleEditedRuleChange(index, 'field', e.target.value)}
										size="small"
										sx={{ width: '200px' }}
									>
										{FIELD_OPTIONS.map((opt) => (
											<MenuItem key={opt.value} value={opt.value}>
												{opt.label}
											</MenuItem>
										))}
									</Select>
									<Select
										value={rule.operator}
										onChange={(e) => handleEditedRuleChange(index, 'operator', e.target.value)}
										size="small"
										sx={{ width: '150px' }}
									>
										{OPERATOR_OPTIONS.map((opt) => (
											<MenuItem key={opt.value} value={opt.value}>
												{opt.label}
											</MenuItem>
										))}
									</Select>
									<TextField
										label="Value"
										variant="outlined"
										size="small"
										value={rule.value}
										onChange={(e) => handleEditedRuleChange(index, 'value', e.target.value)}
										sx={{ flexGrow: 1 }}
									/>
									<IconButton onClick={() => handleRemoveEditedRule(index)} disabled={editedRules.length === 1} color="error">
										<Delete />
									</IconButton>
								</Stack>
							</React.Fragment>
						))}
					</Stack>
					<Button startIcon={<Add />} onClick={handleAddEditedRule} sx={{ mt: 2 }}>
						Add Condition
					</Button>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseEditDialog}>Cancel</Button>
					<Button onClick={handleUpdateRule} variant="contained">
						Save Changes
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
