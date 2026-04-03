
import React from 'react';
import { Box, Typography } from "@mui/material";
import CircularProgressWithLabel from "./CircularProgressWithLabel";

const MetricItem = ({ label, score }) => {

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
			<Box sx={{ width: 40, display: 'flex', justifyContent: 'center', margin: 0.25 }}>
				<CircularProgressWithLabel value={score} size={22} thickness={4} />
			</Box>
			<Typography
				variant="caption"
				sx={{ px: 0.25, borderRadius: 1, fontSize: '0.65rem', lineHeight: 1.2, textAlign: 'center' }}
			>
				{label}
			</Typography>
		</Box>
	);
};

export default MetricItem;
