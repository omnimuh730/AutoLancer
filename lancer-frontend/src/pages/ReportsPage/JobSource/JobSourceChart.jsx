import React from 'react';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { Box, Typography } from '@mui/material';
import { SCALING_POWER } from './constants';

const JobSourceChart = ({ chartData, seriesConfig }) => {
	const { labels, series } = chartData;

	const maxScaledValue = Math.max(...series.flatMap(s => s.scaledData));

	return (
		<Box sx={{ height: '400px', width: '100%', maxWidth: '900px', margin: 'auto', mt: 4 }}>
			<Typography variant="h6" gutterBottom>
				Job Status by Source
			</Typography>
			<RadarChart
				height={400}
				series={series.map(s => ({
					name: s.name,
					data: s.scaledData,
					label: s.name,
					color: seriesConfig[s.key]?.color,
					areaOpacity: 0.4,
					valueFormatter: (value, { dataIndex }) => `${s.originalData[dataIndex]} jobs`,
				}))}
				radar={{
					max: maxScaledValue > 0 ? Math.ceil(maxScaledValue * 1.1) : 10,
					metrics: labels,
					scale: {
						valueFormatter: value => Math.round(Math.pow(value, 1 / SCALING_POWER)).toString(),
					},
				}}
			/>
		</Box>
	);
};

export default JobSourceChart;
