import { Stack, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { JobSource } from '../../../../../../../configs/pub';

export default function DateSourceFilters({
	localPostedAtFrom,
	setLocalPostedAtFrom,
	localPostedAtTo,
	setLocalPostedAtTo,
	jobsourceName,
	setJobsourceName,
}) {
	const handleJobSourceSelect = (event) => {
		const { target: { value } } = event;
		let selectedSource;
		if (value.includes('Select All')) {
			if (jobsourceName.length === JobSource.length) {
				selectedSource = [];
			} else {
				selectedSource = JobSource;
			}
		} else {
			selectedSource = typeof value === 'string' ? value.split(',') : value;
		}
		if (selectedSource.includes('Select All')) {
			selectedSource = selectedSource.filter(item => item !== 'Select All');
		}
		setJobsourceName(selectedSource);
	};

	return (
		<Grid container spacing={2} alignItems="center">
			<Grid size={{ xs: 12, md: 9 }}>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DemoContainer components={['DatePicker', 'DatePicker']}>
						<DatePicker
							label="From date"
							value={localPostedAtFrom}
							onChange={date => setLocalPostedAtFrom(date)}
							slotProps={{ textField: { variant: 'filled', size: 'small', sx: { minWidth: { xs: '100%', sm: 160 }, borderRadius: 1.5 } } }}
						/>
						<DatePicker
							label="To date"
							value={localPostedAtTo}
							onChange={date => setLocalPostedAtTo(date)}
							slotProps={{ textField: { variant: 'filled', size: 'small', sx: { minWidth: { xs: '100%', sm: 160 }, borderRadius: 1.5 } } }}
						/>
					</DemoContainer>
				</LocalizationProvider>
			</Grid>

			<Grid size={{ xs: 12, md: 3 }}>
				<FormControl sx={{ m: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 120, md: 160 }, flexGrow: 1 }}>
					<InputLabel id="job-source-label">Job Source</InputLabel>
					<Select
						labelId="job-source-label"
						id="job-source-select"
						multiple
						value={jobsourceName}
						onChange={handleJobSourceSelect}
						input={<OutlinedInput label="Job Source" />}
						renderValue={(selected) => selected.join(', ')}
					>
						<MenuItem value="Select All">
							<ListItemText primary="Select All" />
						</MenuItem>
						{JobSource.map((item) => (
							<MenuItem key={item} value={item}>
								<Checkbox checked={jobsourceName.includes(item)} />
								<ListItemText primary={item} />
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Grid>
		</Grid>
	);
}

