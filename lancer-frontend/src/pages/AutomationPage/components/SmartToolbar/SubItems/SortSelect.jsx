import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function SortSelect({ sortOption, onSortChange }) {
	return (
		<FormControl fullWidth variant="filled" size="small">
			<InputLabel>Sort by</InputLabel>
			<Select
				value={sortOption}
				onChange={(e) => onSortChange(e.target.value)}
				label="Sort by"
				sx={{ borderRadius: 1.5, '& .MuiSelect-filled': { borderRadius: 1.5 } }}
			>
				<MenuItem value="postedAt_desc">Newest</MenuItem>
				<MenuItem value="postedAt_asc">Oldest</MenuItem>
				<MenuItem value="recommended">Recommended</MenuItem>
			</Select>
		</FormControl>
	);
}

