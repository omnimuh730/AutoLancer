import React from 'react';
import { Box, Grid, Divider, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useSmartToolbarState from './SubItems/useSmartToolbarState';
import SearchInput from './SubItems/SearchInput';
import SortSelect from './SubItems/SortSelect';
import PaginationControls from './SubItems/PaginationControls';
import DateSourceFilters from './SubItems/DateSourceFilters';
import SelectionActions from './SubItems/SelectionActions';
import BasicFilters from './SubItems/sub/BasicFilters';
import JobStatusFilter from './SubItems/sub/JobStatusFilter';

const SmartToolbar = (props) => {
	const {
		searchQuery,
		onSearchChange,
		sortOption,
		onSortChange,
		pagination,
		onPageChange,
		onLimitChange,
		filters = {},
		onFiltersChange = () => { },
		debounceMs = 600,
		selectAllChecked = false,
		onSelectAll,
		onRemoveSelected,
		disableButtons = false,
	} = props;

	const theme = useTheme();
	const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

	const {
		localSearch, setLocalSearch,
		localCompany, setLocalCompany,
		localPostedAtFrom, setLocalPostedAtFrom,
		localPostedAtTo, setLocalPostedAtTo,
		jobsourceName, setJobsourceName,
	} = useSmartToolbarState({
		searchQuery,
		filters,
		onSearchChange,
		onFiltersChange,
		debounceMs,
	});

	return (
		<Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', backdropFilter: 'blur(6px)', mb: 2, position: 'relative' }}>
			<Grid container spacing={2} alignItems="stretch">
				{/* First line: search, company, sort by, pagination */}
				<Grid size={{ xs: 12, md: 2 }}>
					<SearchInput localSearch={localSearch} setLocalSearch={setLocalSearch} />
				</Grid>
				<Grid size={{ xs: 12, md: 2 }}>
					<BasicFilters
						localCompany={localCompany}
						setLocalCompany={setLocalCompany}
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 2 }}>
					<SortSelect sortOption={sortOption} onSortChange={onSortChange} />
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<PaginationControls
						pagination={pagination}
						onPageChange={onPageChange}
						onLimitChange={onLimitChange}
						isSmDown={isSmDown}
					/>
				</Grid>

				<Grid size={{ xs: 12, }}>
					<Divider sx={{ my: 0.5 }} />
				</Grid>

				{/* Second line: job status, dates + source, select/remove */}
				<Grid size={{ xs: 12, md: 4 }}>
					<JobStatusFilter filters={filters} onFiltersChange={onFiltersChange} />
				</Grid>

				<Grid size={{ xs: 12, md: 5 }}>
					<DateSourceFilters
						localPostedAtFrom={localPostedAtFrom}
						setLocalPostedAtFrom={setLocalPostedAtFrom}
						localPostedAtTo={localPostedAtTo}
						setLocalPostedAtTo={setLocalPostedAtTo}
						jobsourceName={jobsourceName}
						setJobsourceName={setJobsourceName}
					/>
				</Grid>

				<Grid size={{ xs: 12, md: 3 }}>
					<SelectionActions
						selectAllChecked={selectAllChecked}
						onSelectAll={onSelectAll}
						onRemoveSelected={onRemoveSelected}
						disableButtons={disableButtons}
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default SmartToolbar;
