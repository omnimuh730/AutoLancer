import React from 'react';
import { Stack, Checkbox, Typography, Button } from '@mui/material';

export default function SelectionActions({ selectAllChecked, onSelectAll, onRemoveSelected, disableButtons }) {
	return (
		<Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" sx={{ pt: { xs: 2, md: 2 } }}>
			<Checkbox checked={selectAllChecked} onChange={e => onSelectAll && onSelectAll(e.target.checked)} />
			<Typography variant="body2">Select All</Typography>
			<Button onClick={onRemoveSelected} disabled={disableButtons} variant='contained' color='error'>
				Remove
			</Button>
		</Stack>
	);
}

