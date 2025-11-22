
import React from 'react';
import { Box, CircularProgress, Typography } from "@mui/material";

const CircularProgressWithLabel = ({ value, size, thickness }) => (
	<Box sx={{ position: 'relative', display: 'inline-flex' }}>
		<CircularProgress variant="determinate" value={value ?? 0} size={size} thickness={thickness} />
		<Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<Typography variant={size > 40 ? "h6" : "caption"} component="div" fontWeight="bold">
				{value !== null ? `${Math.round(value)}` : '?'}
			</Typography>
		</Box>
	</Box>
);

export default CircularProgressWithLabel;
