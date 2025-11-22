import React from 'react';
import {
	TextField,
	InputAdornment,
} from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';

export default function BasicFilters({
	localCompany,
	setLocalCompany,
}) {
	return (
		<>
			<TextField
				label="Company"
				variant="filled"
				size="small"
				value={localCompany}
				onChange={(e) => setLocalCompany(e.target.value)}
				placeholder="e.g., OpenAI"
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<BusinessRoundedIcon color="action" />
						</InputAdornment>
					),
				}}
				sx={{ minWidth: { xs: '100%', sm: 220 }, '& .MuiFilledInput-root': { borderRadius: 1.5 } }}
			/>
		</>
	);
}

