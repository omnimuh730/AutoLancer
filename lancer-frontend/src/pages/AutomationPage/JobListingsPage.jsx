import { useState, useEffect, useCallback, useRef } from "react";
import useNotification from '../../api/useNotification';
// CHANGE 1: Import the Collapse component from MUI
import { Container, Stack, Typography, CircularProgress, Alert, Box, Collapse } from "@mui/material";
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
	const jobApi = useApi(import.meta.env.VITE_API_URL);
	const actionApi = useApi(import.meta.env.VITE_API_URL);
	const { get: jobGet, post: jobPost } = jobApi;
	const { post: actionPost } = actionApi;
	const [jobLoading, setJobLoading] = useState(false);
	const [jobError, setJobError] = useState(null);
	const prefetchedPagesRef = useRef(new Map());

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
		prefetchedPagesRef.current.forEach((value, key) => {
			const idx = Array.isArray(value?.data) ? value.data.findIndex(job => getJobId(job) === jobId) : -1;
			if (idx === -1) return;
			const updated = updater(value.data[idx]);
			if (!updated) return;
			const newData = value.data.slice();
			newData[idx] = updated;
			prefetchedPagesRef.current.set(key, { ...value, data: newData });
		});
	}, []);

	const removeJobsLocally = useCallback((ids) => {
		if (!Array.isArray(ids) || !ids.length) return;
		const idSet = new Set(ids);
		setJobs(prev => prev.filter(job => !idSet.has(getJobId(job))));
		setSelectedIds(prev => prev.filter(id => !idSet.has(id)));
		prefetchedPagesRef.current.forEach((value, key) => {
			if (!Array.isArray(value?.data)) return;
			const newData = value.data.filter(job => !idSet.has(getJobId(job)));
			if (newData.length !== value.data.length) {
				prefetchedPagesRef.current.set(key, { ...value, data: newData });
			}
		});
	}, []);

	const fetchJobs = useCallback(async (pageOverride = pagination.page, { silent = false } = {}) => {
		const body = {
			q: searchQuery,
			sort: sortOption,
			page: pageOverride,
			limit: pagination.limit,
			applierName: applier?.name,
			...filters
		};
		if (!silent) {
			setJobLoading(true);
			setJobError(null);
		}
		try {
			const res = await jobPost('/jobs/list', body);
			if (res && res.success) {
				prefetchedPagesRef.current.set(pageOverride, { data: res.data, pagination: res.pagination });
				if (!silent && pageOverride === pagination.page) {
					setJobs(res.data);
					setPagination(res.pagination);
				}
			}
			if (!silent) {
				setJobLoading(false);
			}
			return res;
		} catch (err) {
			console.warn('Failed to fetch jobs from backend', err);
			if (!silent) {
				setJobLoading(false);
				setJobError(err);
			}
			throw err;
		}
	}, [searchQuery, sortOption, pagination.page, pagination.limit, jobPost, filters, applier?.name]);

	const fetchUserSkills = useCallback(async () => {
		try {
			const res = await jobGet('/personal/skills');
			if (res && res.success && Array.isArray(res.skills)) {
				setUserSkills(res.skills);
			}
		} catch (err) {
			console.warn('Failed to fetch user skills', err);
		}
	}, [jobGet]);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			const cached = prefetchedPagesRef.current.get(pagination.page);
			if (cached) {
				setJobs(cached.data);
				setPagination(prev => ({ ...cached.pagination, page: pagination.page }));
				// Prefetch next page silently
				const nextPage = pagination.page + 1;
				if (nextPage <= (cached.pagination?.totalPages || pagination.totalPages)) {
					fetchJobs(nextPage, { silent: true }).catch(() => { });
				}
				return;
			}
			try {
				const res = await fetchJobs(pagination.page);
				if (!cancelled && res?.pagination) {
					const nextPage = pagination.page + 1;
					if (nextPage <= res.pagination.totalPages) {
						fetchJobs(nextPage, { silent: true }).catch(() => { });
					}
				}
			} catch (err) {
				// handled in fetchJobs
			}
		};
		load();
		return () => { cancelled = true; };
	}, [pagination.page, fetchJobs, pagination.totalPages]);

	useEffect(() => {
		fetchUserSkills();
	}, [fetchUserSkills]);

	useEffect(() => {
		prefetchedPagesRef.current.clear();
	}, [searchQuery, sortOption, filters, pagination.limit, applierId]);

	useEffect(() => {
		setPagination(prev => prev.page === 1 ? prev : { ...prev, page: 1 });
	}, [searchQuery, sortOption]);

	const handleViewDetails = (job) => {
		setSelectedJob(job);
	};

	const handleCloseDrawer = () => {
		setSelectedJob(null);
		if (skillsChanged) {
			setSkillsChanged(false);
			fetchUserSkills();
			fetchJobs(pagination.page).catch(() => { });
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
			const res = await actionPost(`/jobs/${strId}/apply`, { applied: true, applierName: applier?.name });
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
			const res = await actionPost(`/jobs/${strId}/status`, { status, applierName: applier?.name });
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
			const res = await actionPost(`/jobs/${strId}/unapply`, { applierName: applier?.name });
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
			const res = await actionPost('/jobs/remove', { ids: selectedIds });
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

				{jobLoading ? (
					<CircularProgress />
				) : jobError ? (
					<Alert severity="error">
						Failed to load jobs. {jobError?.message || 'Please try again later.'}
					</Alert>
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
