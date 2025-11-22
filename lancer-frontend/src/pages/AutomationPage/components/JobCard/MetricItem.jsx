
import React from 'react';
import { Box, Typography } from "@mui/material";
import CircularProgressWithLabel from "./CircularProgressWithLabel";

const MetricItem = ({ label, score }) => {

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
			<Box sx={{ width: 60, display: 'flex', justifyContent: 'center', margin: 0.5 }}>
				<CircularProgressWithLabel value={score} size={30} thickness={5} />
			</Box>
			<Typography
				variant="caption"
				sx={{ px: 0.5, borderRadius: 1 }}
			>
				{label}
			</Typography>
		</Box>
	);
};

export default MetricItem;
