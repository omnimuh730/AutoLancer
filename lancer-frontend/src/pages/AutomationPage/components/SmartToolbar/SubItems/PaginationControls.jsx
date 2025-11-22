import React from 'react';
import { Stack, Typography, Pagination, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function PaginationControls({ pagination, onPageChange, onLimitChange, isSmDown }) {
	return (
		<Stack
			direction={{ xs: 'column', md: 'row' }}
			spacing={1.5}
			alignItems={{ xs: 'flex-start', md: 'center' }}
			justifyContent="flex-end"
			sx={{ height: '100%', px: { xs: 0.5, md: 0 } }}
		>
			<Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
				Page {pagination.page} of {pagination.totalPages}
			</Typography>
			<Pagination
				count={pagination.totalPages}
				page={pagination.page}
				onChange={(e, value) => onPageChange(value)}
				color="primary"
				variant="outlined"
				shape="rounded"
				size={isSmDown ? 'small' : 'medium'}
				sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
			/>
			<FormControl variant="filled" size="small" sx={{ minWidth: 120, '& .MuiFilledInput-root': { borderRadius: 1.5 } }}>
				<InputLabel>Per page</InputLabel>
				<Select value={pagination.limit} onChange={(e) => onLimitChange(e.target.value)} label="Per page">
					<MenuItem value={10}>10</MenuItem>
					<MenuItem value={25}>25</MenuItem>
					<MenuItem value={50}>50</MenuItem>
					<MenuItem value={100}>100</MenuItem>
				</Select>
			</FormControl>
		</Stack>
	);
}

