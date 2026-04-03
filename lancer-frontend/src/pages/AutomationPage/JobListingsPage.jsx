import { useState, useEffect, useLayoutEffect, useCallback, useMemo, memo, useRef } from "react";
import useNotification from '../../api/useNotification';
// CHANGE 1: Import the Collapse component from MUI
import { Container, Stack, Typography, CircularProgress, Alert, Box, Collapse } from "@mui/material";
import { Fab, Tooltip } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { List } from "react-window";

import useApi from "../../api/useApi";

// Component Imports
import JobCard from "./components/JobCard";
import JobDetailDrawer from "./components/JobDetailDrawer";
import SmartToolbar from "./components/SmartToolbar";
import { useApplier } from "../../context/ApplierContext.jsx";

/** Fixed row height for virtualization; keep in sync with JobCard + compact MatchPanel. */
const LIST_ROW_HEIGHT = 268;

const VirtualJobRow = memo(function VirtualJobRow({
	index,
	style,
	jobs,
	userSkills,
	selectedIds,
	onViewDetails,
	onApply,
	onUpdateStatus,
	onUnapply,
	onSelectJob,
	getJobId,
}) {
	const job = jobs[index];
	if (!job) return null;
	const id = getJobId(job);
	return (
		<div style={{ ...style, width: "100%", boxSizing: "border-box" }}>
			<Box sx={{ pr: { xs: 0, sm: 1 }, width: "100%", minWidth: 0 }}>
				<JobCard
					job={job}
					userSkills={userSkills}
					onViewDetails={onViewDetails}
					onApply={onApply}
					onUpdateStatus={onUpdateStatus}
					onUnapply={onUnapply}
					checked={id ? selectedIds.includes(id) : false}
					onCheck={(checked) => onSelectJob(job._id || job.id, checked)}
				/>
			</Box>
		</div>
	);
});

// Helper function to consistently get a string ID from a job object
const getJobId = (job) => {
	const id = job && (job._id || job.id);
	if (!id) return null;
	return typeof id === 'object' && id.$oid ? id.$oid : String(id);
};

const normalizeId = (value) => {
	if (!value) return '';
	if (typeof value === 'object' && value.$oid) return value.$oid;
	return String(value);
};

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

	const [selectedJob, setSelectedJob] = useState(null);
	const [userSkills, setUserSkills] = useState([]);
	const [selectedIds, setSelectedIds] = useState([]);
	const [skillsChanged, setSkillsChanged] = useState(true);
	const [isToolbarVisible, setIsToolbarVisible] = useState(true);
	const [listViewportHeight, setListViewportHeight] = useState(400);
	const listWrapperRef = useRef(null);

	const notification = useNotification();
	const { applier } = useApplier();
	const applierId = applier?._id ? normalizeId(applier._id) : null;

	/** List height follows the flex area (fills <main>); only the virtual list scrolls, not DashboardLayout <main>. */
	useLayoutEffect(() => {
		const el = listWrapperRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver((entries) => {
			const h = Math.floor(entries[0]?.contentRect?.height ?? 0);
			setListViewportHeight((prev) => {
				const next = Math.max(160, h);
				return next === prev ? prev : next;
			});
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [jobLoading, jobError, jobs.length, isToolbarVisible]);

	const fetchJobs = useCallback(async (pageOverride = pagination.page, { silent = false } = {}) => {
		const pageToFetch = typeof pageOverride === 'number' ? pageOverride : pagination.page;
		const body = {
			q: searchQuery,
			sort: sortOption,
			page: pageToFetch,
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
			if (res?.success) {
				setJobs(res.data || []);
				if (res.pagination) {
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
		fetchJobs(pagination.page).catch(() => { });
	}, [pagination.page, fetchJobs]);

	useEffect(() => {
		fetchUserSkills();
	}, [fetchUserSkills]);

	useEffect(() => {
		setPagination(prev => prev.page === 1 ? prev : { ...prev, page: 1 });
	}, [searchQuery, sortOption]);

	const handleViewDetails = useCallback((job) => {
		setSelectedJob(job);
	}, []);

	const handleCloseDrawer = useCallback(() => {
		setSelectedJob(null);
		if (skillsChanged) {
			setSkillsChanged(false);
			fetchUserSkills();
			fetchJobs(pagination.page).catch(() => { });
		}
	}, [skillsChanged, fetchUserSkills, fetchJobs, pagination.page]);

	const handlePageChange = useCallback((newPage) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	}, []);

	const handleLimitChange = useCallback((newLimit) => {
		setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
	}, []);

	const handleApplyJob = useCallback(async (job) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before applying.');
			return;
		}
		try {
			const res = await actionPost(`/jobs/${strId}/apply`, { applied: true, applierName: applier?.name });
			if (res?.success) {
				await fetchJobs(pagination.page, { silent: true });
			} else {
				throw new Error('Apply API failed');
			}
		} catch (e) {
			console.warn('Failed to mark job applied', e);
			notification.error('Failed to mark job as applied');
		}
	}, [actionPost, applierId, applier?.name, fetchJobs, notification, pagination.page]);

	const handleUpdateJobStatus = useCallback(async (job, status) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before updating status.');
			return;
		}
		try {
			const res = await actionPost(`/jobs/${strId}/status`, { status, applierName: applier?.name });
			if (res?.success) {
				await fetchJobs(pagination.page, { silent: true });
				notification.success(`Job status updated to ${status}`);
			} else {
				throw new Error('Failed to update status');
			}
		} catch (e) {
			console.warn('Failed to update job status', e);
			notification.error('Failed to update job status');
		}
	}, [actionPost, applierId, applier?.name, fetchJobs, notification, pagination.page]);

	const handleUnapplyJob = useCallback(async (job) => {
		const strId = getJobId(job);
		if (!strId || !applierId) {
			notification.error('Select an applier before unapplying.');
			return;
		}
		try {
			const res = await actionPost(`/jobs/${strId}/unapply`, { applierName: applier?.name });
			if (res?.success) {
				await fetchJobs(pagination.page, { silent: true });
				notification.success('Successfully unapplied from job');
			} else {
				throw new Error('Failed to unapply');
			}
		} catch (e) {
			console.warn('Failed to unapply from job', e);
			notification.error('Failed to unapply from job');
		}
	}, [actionPost, applierId, applier?.name, fetchJobs, notification, pagination.page]);

	const handleSelectAll = useCallback((checked) => {
		setSelectedIds(checked ? jobs.map(job => getJobId(job)) : []);
	}, [jobs]);

	const handleSelectJob = useCallback((id, checked) => {
		const strId = getJobId({ id });
		setSelectedIds(prev => checked ? [...prev, strId] : prev.filter(_id => _id !== strId));
	}, []);

	const handleRemoveSelected = useCallback(async () => {
		if (!selectedIds.length) return;
		try {
			const res = await actionPost('/jobs/remove', { ids: selectedIds });
			if (res && res.success) {
				notification.success(`Removed ${res.deletedCount || 0} job(s)`);
				setSelectedIds([]);
				await fetchJobs(pagination.page, { silent: true });
			} else {
				throw new Error('Failed to remove');
			}
		} catch (err) {
			console.warn('Failed to remove jobs', err);
			notification.error('Failed to remove jobs');
		}
	}, [actionPost, selectedIds, fetchJobs, notification, pagination.page]);

	const onFiltersChange = useCallback((next) => {
		setFilters(next);
		setPagination(p => ({ ...p, page: 1 }));
	}, []);

	const listItemData = useMemo(
		() => ({
			jobs,
			userSkills,
			selectedIds,
			onViewDetails: handleViewDetails,
			onApply: handleApplyJob,
			onUpdateStatus: handleUpdateJobStatus,
			onUnapply: handleUnapplyJob,
			onSelectJob: handleSelectJob,
			getJobId,
		}),
		[
			jobs,
			userSkills,
			selectedIds,
			handleViewDetails,
			handleApplyJob,
			handleUpdateJobStatus,
			handleUnapplyJob,
			handleSelectJob,
		]
	);


	return (
		<Box
			sx={{
				flex: 1,
				minHeight: 0,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				width: "100%",
			}}
		>
		<Container
			maxWidth="xl"
			sx={{
				flex: 1,
				minHeight: 0,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				py: { xs: 1, sm: 1.5 },
				px: { xs: 1.5, sm: 3 },
				width: "100%",
				boxSizing: "border-box",
			}}
		>
			<Stack
				spacing={1}
				sx={{
					width: "100%",
					minWidth: 0,
					flex: 1,
					minHeight: 0,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* WRAPPER FOR STICKY HEADER */}
				<Box
					sx={{
						position: 'sticky',
						top: 0,
						zIndex: 1100,
						backgroundColor: 'background.paper',
						pt: { xs: 1.5, sm: 2.5 },
						width: "100%",
						minWidth: 0,
						flexShrink: 0,
					}}
				>
					{/* The original header Box (without its own padding now) */}
					<Box
						display="flex"
						flexDirection={{ xs: "column", sm: "row" }}
						justifyContent="space-between"
						alignItems={{ xs: "flex-start", sm: "center" }}
						gap={0.5}
						width="100%"
					>
						<Typography
							variant="h4"
							component="h1"
							fontWeight="bold"
							sx={{
								fontSize: { xs: "1.35rem", sm: "2rem" },
								lineHeight: 1.25,
								wordBreak: "break-word",
							}}
						>
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
						<Box sx={{ pt: 1.25 }}>
							<SmartToolbar
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								sortOption={sortOption}
								onSortChange={setSortOption}
								pagination={pagination}
								onPageChange={handlePageChange}
								onLimitChange={handleLimitChange}
								filters={filters}
								onFiltersChange={onFiltersChange}
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

				{jobError ? (
					<Alert severity="error" sx={{ flexShrink: 0 }}>
						Failed to load jobs. {jobError?.message || 'Please try again later.'}
					</Alert>
				) : (
					<Box
						ref={listWrapperRef}
						sx={{
							flex: 1,
							minHeight: 0,
							minWidth: 0,
							width: "100%",
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{jobLoading ? (
							<Box
								sx={{
									flex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									minHeight: 200,
								}}
							>
								<CircularProgress />
							</Box>
						) : (
							<List
								rowCount={jobs.length}
								rowHeight={LIST_ROW_HEIGHT}
								rowComponent={VirtualJobRow}
								rowProps={listItemData}
								overscanCount={2}
								style={{
									height: listViewportHeight,
									width: "100%",
									minWidth: 0,
								}}
							/>
						)}
					</Box>
				)}
			</Stack>

			<JobDetailDrawer
				job={selectedJob}
				open={!!selectedJob}
				onClose={handleCloseDrawer}
				onSkillsChanged={() => setSkillsChanged(true)}
			/>
		</Container>
		</Box>
	);
}

export default JobListingsPage;
