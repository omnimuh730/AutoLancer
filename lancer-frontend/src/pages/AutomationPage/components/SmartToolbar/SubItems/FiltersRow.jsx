import React from 'react';
import { Stack } from '@mui/material';
import BasicFilters from './sub/BasicFilters';
import JobStatusFilter from './sub/JobStatusFilter';

export default function FiltersRow({
	localCompany, setLocalCompany,
	localPosition, setLocalPosition,
	localRemote, setLocalRemote,
	localTime, setLocalTime,
	localTags, setLocalTags,
	filters, onFiltersChange,
}) {
	return (
		<Stack
			direction={{ xs: 'column', md: 'row' }}
			spacing={1.5}
			alignItems={{ xs: 'stretch', md: 'center' }}
			useFlexGap
			flexWrap="wrap"
		>
			<BasicFilters
				localCompany={localCompany}
				setLocalCompany={setLocalCompany}
				localPosition={localPosition}
				setLocalPosition={setLocalPosition}
				localRemote={localRemote}
				setLocalRemote={setLocalRemote}
				localTime={localTime}
				setLocalTime={setLocalTime}
				localTags={localTags}
				setLocalTags={setLocalTags}
			/>
			<JobStatusFilter filters={filters} onFiltersChange={onFiltersChange} />
		</Stack>
	);
}

