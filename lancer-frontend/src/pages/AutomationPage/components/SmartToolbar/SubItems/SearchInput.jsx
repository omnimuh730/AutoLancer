import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export default function SearchInput({ localSearch, setLocalSearch }) {
	return (
		<TextField
			fullWidth
			variant="filled"
			size="small"
			label="Search jobs (title)"
			value={localSearch}
			onChange={(e) => setLocalSearch(e.target.value)}
			placeholder="e.g., Senior Frontend Engineer"
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<SearchRoundedIcon color="action" />
					</InputAdornment>
				),
			}}
			sx={{ '& .MuiFilledInput-root': { borderRadius: 1.5 } }}
		/>
	);
}

