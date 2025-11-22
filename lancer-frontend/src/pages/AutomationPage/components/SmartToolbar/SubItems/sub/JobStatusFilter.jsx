import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const getJobStatusFilter = (filters) => {
	if (filters.applied === true) {
		return filters.status || 'Applied';
	}
	if (filters.applied === false) {
		return 'Posted';
	}
	return 'All';
};

export default function JobStatusFilter({ filters, onFiltersChange }) {
	return (
		<FormControl component="fieldset">
			<FormLabel component="legend">Job Status</FormLabel>
			<RadioGroup
				row
				value={getJobStatusFilter(filters)}
				onChange={(e) => {
					const newStatus = e.target.value;
					const next = { ...filters };
					if (newStatus === 'All') {
						delete next.applied;
						delete next.status;
					} else if (newStatus === 'Posted') {
						next.applied = false;
						delete next.status;
					} else {
						next.applied = true;
						next.status = newStatus;
					}
					onFiltersChange(next);
				}}
			>
				<FormControlLabel value="All" control={<Radio />} label="All" />
				<FormControlLabel value="Posted" control={<Radio />} label="Post" />
				<FormControlLabel value="Applied" control={<Radio />} label="Apply" />
				<FormControlLabel value="Scheduled" control={<Radio />} label="Schedule" />
				<FormControlLabel value="Declined" control={<Radio />} label="Reject" />
			</RadioGroup>
		</FormControl>
	);
}

