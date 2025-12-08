import { useState, useEffect, useCallback } from "react";
import useNotification from '../../api/useNotification';
// CHANGE 1: Import the Collapse component from MUI
import { Container, Stack, Typography, CircularProgress, Alert, Button, Box, Collapse } from "@mui/material";
import { Fab, Tooltip } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import useApi from "../../api/useApi";

// Component Imports
import JobCard from "./components/JobCard";
import JobDetailDrawer from "./components/JobDetailDrawer";
import SmartToolbar from "./components/SmartToolbar";
import { useApplier } from "../../context/ApplierContext.jsx";

// Helper function to consistently get a string ID from a job object
const getJobId = (job) => {
	const id = job && (job._id || job.id);
	if (!id) return null;
	return typeof id === 'object' && id.$oid ? id.$oid : String(id);
};

const cloneJob = (job) => JSON.parse(JSON.stringify(job));
const normalizeId = (value) => {
	if (!value) return '';
	if (typeof value === 'object' && value.$oid) return value.$oid;
	return String(value);
};

const cloneStatusArray = (status) => Array.isArray(status) ? status.map(entry => ({ ...entry })) : [];

function JobListingsPage() {
	const [jobs, setJobs] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("postedAt_desc");
	const [filters, setFilters] = useState({ showLinkedInOnly: true, applied: false });
	const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
	const { loading, error, get, post } = useApi(import.meta.env.VITE_API_URL);

	const [selectedJob, setSelectedJob] = useState(null);
	const [userSkills, setUserSkills] = useState([]);
	const [selectedIds, setSelectedIds] = useState([]);
	const [skillsChanged, setSkillsChanged] = useState(true);
	const [isToolbarVisible, setIsToolbarVisible] = useState(true);

	const notification = useNotification();
	const { applier } = useApplier();
	const applierId = applier?._id ? normalizeId(applier._id) : null;

	const replaceJob = useCallback((jobId, updater) => {
		if (!jobId || typeof updater !== 'function') return;
		setJobs(prev => prev.map(job => {
			const currentId = getJobId(job);
			if (currentId !== jobId) return job;
			const nextJob = updater(job);
			return nextJob || job;
		}));
	}, []);

	const removeJobsLocally = useCallback((ids) => {
		if (!Array.isArray(ids) || !ids.length) return;
		const idSet = new Set(ids);
		setJobs(prev => prev.filter(job => !idSet.has(getJobId(job))));
		setSelectedIds(prev => prev.filter(id => !idSet.has(id)));
	}, []);

	const fetchJobs = useCallback(async () => {
		try {
			const body = {
				q: searchQuery,
				sort: sortOption,
				page: pagination.page,
				limit: pagination.limit,
				applierName: applier?.name,
				...filters
			};

			const res = await post('/jobs/list', body);
			if (res && res.success) {
				setJobs(res.data);
				setPagination(res.pagination);
			}
		} catch (err) {
			console.warn('Failed to fetch jobs from backend', err);
		}
	}, [searchQuery, sortOption, pagination.page, pagination.limit, post, filters, applier]);

	const fetchUserSkills = useCallback(async () => {
		try {
			const res = await get('/personal/skills');
			if (res && res.success && Array.isArray(res.skills)) {
				setUserSkills(res.skills);
			}
		} catch (err) {
			console.warn('Failed to fetch user skills', err);
		}
	}, [get]);

	useEffect(() => {
		fetchJobs();
	}, [fetchJobs]);

	useEffect(() => {
		fetchUserSkills();
	}, [fetchUserSkills]);

	const handleViewDetails = (job) => {
		setSelectedJob(job);
	};

	const handleCloseDrawer = () => {
		setSelectedJob(null);
		if (skillsChanged) {
			setSkillsChanged(false);
			fetchUserSkills();
			fetchJobs();
		}
	};

	const handlePageChange = (newPage) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	const handleLimitChange = (newLimit) => {
		setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
	};

	const handleApplyJob = async (job) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before applying.');
			return;
		}
		const previousSnapshot = cloneJob(job);
		const optimisticEntry = { applier: applierId, appliedDate: new Date().toISOString() };
		replaceJob(strId, (current) => {
			const statusList = cloneStatusArray(current.status);
			if (!statusList.some(entry => normalizeId(entry.applier) === applierId)) {
				statusList.push(optimisticEntry);
			}
			return { ...current, status: statusList };
		});
		try {
			const res = await post(`/jobs/${strId}/apply`, { applied: true, applierName: applier?.name });
			if (res && res.success && res.data) {
				if (filters.applied === false) {
					removeJobsLocally([strId]);
				} else {
					replaceJob(strId, () => res.data);
				}
			} else {
				throw new Error('Apply API failed');
			}
		} catch (e) {
			console.warn('Failed to mark job applied', e);
			replaceJob(strId, () => previousSnapshot);
			notification.error('Failed to mark job as applied');
		}
	};

	const handleUpdateJobStatus = async (job, status) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before updating status.');
			return;
		}
		const previousSnapshot = cloneJob(job);
		replaceJob(strId, (current) => {
			const statusList = cloneStatusArray(current.status);
			const idx = statusList.findIndex(entry => normalizeId(entry.applier) === applierId);
			if (idx === -1) return current;
			const now = new Date().toISOString();
			const updatedEntry = { ...statusList[idx] };
			if (status === 'Declined') {
				updatedEntry.declinedDate = now;
				delete updatedEntry.scheduledDate;
			} else if (status === 'Scheduled') {
				updatedEntry.scheduledDate = now;
				delete updatedEntry.declinedDate;
			} else if (status === 'Applied') {
				delete updatedEntry.declinedDate;
				delete updatedEntry.scheduledDate;
			}
			statusList[idx] = updatedEntry;
			return { ...current, status: statusList };
		});
		try {
			const res = await post(`/jobs/${strId}/status`, { status, applierName: applier?.name });
			if (res && res.success && res.data) {
				replaceJob(strId, () => res.data);
				notification.success(`Job status updated to ${status}`);
			} else {
				throw new Error('Failed to update status');
			}
		} catch (e) {
			console.warn('Failed to update job status', e);
			replaceJob(strId, () => previousSnapshot);
			notification.error('Failed to update job status');
		}
	};

	const handleUnapplyJob = async (job) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before unapplying.');
			return;
		}
		const previousSnapshot = cloneJob(job);
		replaceJob(strId, (current) => {
			const statusList = cloneStatusArray(current.status).filter(entry => normalizeId(entry.applier) !== applierId);
			return { ...current, status: statusList };
		});
		try {
			const res = await post(`/jobs/${strId}/unapply`, { applierName: applier?.name });
			if (res && res.success && res.data) {
				if (filters.applied === true) {
					removeJobsLocally([strId]);
				} else {
					replaceJob(strId, () => res.data);
				}
				notification.success('Successfully unapplied from job');
			} else {
				throw new Error('Failed to unapply');
			}
		} catch (e) {
			console.warn('Failed to unapply from job', e);
			replaceJob(strId, () => previousSnapshot);
			notification.error('Failed to unapply from job');
		}
	};

	const handleSelectAll = (checked) => {
		setSelectedIds(checked ? jobs.map(job => getJobId(job)) : []);
	};

	const handleSelectJob = (id, checked) => {
		const strId = getJobId({ id });
		setSelectedIds(prev => checked ? [...prev, strId] : prev.filter(_id => _id !== strId));
	};

	const handleRemoveSelected = async () => {
		if (!selectedIds.length) return;
		const previousJobs = jobs;
		const previousSelected = selectedIds;
		removeJobsLocally(selectedIds);
		try {
			const res = await post('/jobs/remove', { ids: selectedIds });
			if (res && res.success) {
				notification.success(`Removed ${res.deletedCount || 0} job(s)`);
				setSelectedIds([]);
			} else {
				throw new Error('Failed to remove');
			}
		} catch (err) {
			console.warn('Failed to remove jobs', err);
			setJobs(previousJobs);
			setSelectedIds(previousSelected);
			notification.error('Failed to remove jobs');
		}
	};


	return (
		<Container maxWidth="xl" sx={{ py: 4, minHeight: "100vh" }}>
			<Stack spacing={2.5}>
				{/* WRAPPER FOR STICKY HEADER */}
				<Box
					sx={{
						position: 'sticky',
						top: 0, // Stick to the very top of the viewport
						zIndex: 1100, // A high z-index to stay above other content
						backgroundColor: 'background.paper', // Crucial to hide content scrolling underneath
						// We move the top padding here from the Container to control spacing correctly
						pt: 4,
					}}
				>
					{/* The original header Box (without its own padding now) */}
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						width="100%"
					>
						<Typography variant="h4" component="h1" fontWeight="bold">
							{`Recommended Jobs (${pagination.total || 0})`}
						</Typography>
						<Tooltip title={isToolbarVisible ? "Hide Toolbar" : "Show Toolbar"}>
							<Fab
								size="small"
								aria-label={isToolbarVisible ? "hide toolbar" : "show toolbar"}
								onClick={() => setIsToolbarVisible(!isToolbarVisible)}
							>
								{isToolbarVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
							</Fab>
						</Tooltip>
					</Box>

					{/* The Collapse component with the toolbar */}
					<Collapse in={isToolbarVisible} timeout="auto" unmountOnExit>
						<Box sx={{ pt: 2 }}> {/* Add some top padding for spacing */}
							<SmartToolbar
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								sortOption={sortOption}
								onSortChange={setSortOption}
								pagination={pagination}
								onPageChange={handlePageChange}
								onLimitChange={handleLimitChange}
								filters={filters}
								onFiltersChange={(next) => { setFilters(next); setPagination(p => ({ ...p, page: 1 })); }}
								selectAllChecked={selectedIds.length === jobs.length && jobs.length > 0}
								onSelectAll={handleSelectAll}
								onRemoveSelected={handleRemoveSelected}
								disableButtons={!selectedIds.length}
								showLinkedInOnly={!!filters.showLinkedInOnly}
								onShowLinkedInOnlyChange={checked => setFilters(f => ({ ...f, showLinkedInOnly: checked }))}
							/>
						</Box>
					</Collapse>
				</Box>

				{loading ? (
					<CircularProgress />
				) : error ? (
					<Alert severity="error">Failed to load jobs. Please try again later.</Alert>
				) : (
					jobs.map((job, idx) => (
						<JobCard
							key={getJobId(job) || idx}
							job={job}
							userSkills={userSkills}
							onViewDetails={handleViewDetails}
							onApply={handleApplyJob}
							onUpdateStatus={handleUpdateJobStatus}
							onUnapply={handleUnapplyJob}
							checked={selectedIds.includes(getJobId(job))}
							onCheck={(checked) => handleSelectJob(job._id || job.id, checked)}
						/>
					))
				)}
			</Stack>

			<JobDetailDrawer
				job={selectedJob}
				open={!!selectedJob}
				onClose={handleCloseDrawer}
				onSkillsChanged={() => setSkillsChanged(true)}
			/>
		</Container>
	);
}

export default JobListingsPage;
