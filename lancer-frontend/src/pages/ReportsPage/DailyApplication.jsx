import React, { useEffect, useState } from "react";
import useApi from "../../api/useApi.js";
import { Box, CircularProgress, Typography, Grid, Paper, Tooltip } from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useApplier } from '../../context/ApplierContext.jsx';

const YearlyHeatmap = ({ data }) => {
	const cellSize = 14;
	const margin = { top: 18, left: 18 };
	const year = new Date().getFullYear();
	const startDate = new Date(year, 0, 1);
	const endDate = new Date(year, 11, 31);

	// Start from the Sunday of the first week to align columns
	const startOfWeek = new Date(startDate);
	startOfWeek.setDate(startDate.getDate() - startDate.getDay());

	const dates = [];
	for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
		dates.push(new Date(d));
	}

	const dataMap = new Map(data.map(d => [d.date, d.value]));

	const max = Math.max(0, ...data.map(d => d.value));
	const colorScale = (value) => {
		if (!value) return '#ebedf0';
		const ratio = max ? value / max : 0;
		if (ratio > 0.75) return '#216e39';
		if (ratio > 0.5) return '#30a14e';
		if (ratio > 0.25) return '#40c463';
		return '#9be9a8';
	};

	// Use UTC day key to align with backend aggregation (prevents 1-day shifts)
	const fmt = (date) => date.toISOString().slice(0, 10);

	const weeks = Math.ceil((endDate - startOfWeek) / (7 * 24 * 3600 * 1000));
	const width = margin.left + cellSize * weeks;
	const height = margin.top + cellSize * 7;
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	return (
		<svg width={width} height={height} role="img" aria-label="Yearly applications heatmap">
			{/* Y axis day labels */}
			{days.map((d, i) => (
				<text key={d} x={0} y={margin.top + i * cellSize + cellSize * 0.7} fontSize={10} fill="#888">{d}</text>
			))}
			<g transform={`translate(${margin.left}, ${margin.top})`}>
				{dates.map((date, index) => {
					const day = date.getDay();
					const weekIndex = Math.floor((date - startOfWeek) / (7 * 24 * 3600 * 1000));
					const dateString = fmt(date);
					const value = dataMap.get(dateString) || 0;
					return (
						<Tooltip title={`${value} applications on ${dateString}`} key={index}>
							<rect
								x={weekIndex * cellSize}
								y={day * cellSize}
								width={cellSize - 1}
								height={cellSize - 1}
								fill={colorScale(value)}
							/>
						</Tooltip>
					);
				})}
			</g>
		</svg>
	);
};

const FrequencyHeatmap = ({ data, title, colorScheme }) => {
	const cellSize = 16;
	const margin = { top: 20, left: 36, bottom: 20 };
	const hours = Array.from({ length: 24 }, (_, i) => i);
	const dates = [...new Set(data.map(d => d._id))].sort();

	const dataMap = new Map();
	data.forEach(d => {
		d.hourlyData.forEach(h => {
			dataMap.set(`${d._id}-${h.hour}`, h.count);
		});
	});

	const max = Math.max(0, ...Array.from(dataMap.values()));
	const colorScale = (value) => {
		if (!value) return '#ebedf0';
		const r = max ? value / max : 0;
		if (colorScheme === 'greens') {
			if (r > 0.75) return '#216e39';
			if (r > 0.5) return '#30a14e';
			if (r > 0.25) return '#40c463';
			return '#9be9a8';
		} else {
			if (r > 0.75) return '#0d47a1';
			if (r > 0.5) return '#1976d2';
			if (r > 0.25) return '#42a5f5';
			return '#90caf9';
		}
	};

	const width = margin.left + dates.length * cellSize + 80; // extra for right padding
	const height = margin.top + hours.length * cellSize + margin.bottom;

	return (
		<Paper sx={{ p: 2, height: '100%' }}>
			<Typography variant="h6" gutterBottom>{title}</Typography>
			<Box sx={{ overflowX: 'auto' }}>
				<svg width={width} height={height} role="img" aria-label={`${title} heatmap`}>
					{/* Y axis hours labels */}
					{hours.map((h) => (
						(h % 2 === 0) && (
							<text key={`h-${h}`} x={0} y={margin.top + h * cellSize + cellSize * 0.7} fontSize={10} fill="#888">{String(h).padStart(2, '0')}</text>
						)
					))}
					{/* X axis date labels */}
					{dates.map((d, i) => (
						<text key={`d-${d}`} x={margin.left + i * cellSize + 2} y={12} fontSize={10} fill="#888" transform={`rotate( -45 ${margin.left + i * cellSize + 2} 12)`}>{d.slice(5)}</text>
					))}
					<g transform={`translate(${margin.left}, ${margin.top})`}>
						{dates.map((date, dateIndex) => (
							hours.map((hour) => {
								const value = dataMap.get(`${date}-${hour}`) || 0;
								const key = `${date}-${hour}`;
								return (
									<Tooltip title={`${value} at ${date} ${String(hour).padStart(2, '0')}:00`} key={key}>
										<rect
											x={dateIndex * cellSize}
											y={hour * cellSize}
											width={cellSize - 1}
											height={cellSize - 1}
											fill={colorScale(value)}
										/>
									</Tooltip>
								);
							})
						))}
					</g>
				</svg>
			</Box>
		</Paper>
	);
};

const DailyApplication = () => {
	const { get } = useApi();
	const { applier } = useApplier();
	const [yearlyData, setYearlyData] = useState([]);
	const [postingFrequencyData, setPostingFrequencyData] = useState([]);
	const [applicationFrequencyData, setApplicationFrequencyData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month'));
	const [endDate, setEndDate] = useState(dayjs());

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const applierParam = applier?.name ? `&applierName=${encodeURIComponent(applier.name)}` : '';
				const applierParamFirst = applier?.name ? `?applierName=${encodeURIComponent(applier.name)}` : '';
				const [yearlyRes, postingFreqRes, applicationFreqRes] = await Promise.all([
					get(`/reports/daily-applications${applierParamFirst}`),
					get(`/reports/job-posting-frequency?startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`),
					get(`/reports/job-application-frequency?startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}${applierParam}`)
				]);

				if (yearlyRes.success) setYearlyData(yearlyRes.data || []);
				else setError(yearlyRes.error || "Failed to fetch yearly data");

				if (postingFreqRes.success) setPostingFrequencyData(postingFreqRes.data || []);
				else setError(postingFreqRes.error || "Failed to fetch posting frequency data");

				if (applicationFreqRes.success) setApplicationFrequencyData(applicationFreqRes.data || []);
				else setError(applicationFreqRes.error || "Failed to fetch application frequency data");

			} catch (err) {
				setError(err.message || "An error occurred");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [get, startDate, endDate, applier]);

	if (loading) return <CircularProgress />;
	if (error) return <Typography color="error">{error}</Typography>;

	return (
		<Box sx={{ width: '100%' }}>
			<Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
				<Typography variant="h6" gutterBottom>Yearly Application Insights</Typography>
				{yearlyData.length > 0 ? <YearlyHeatmap data={yearlyData} /> : <Typography>No yearly application data available.</Typography>}
			</Paper>

			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Paper sx={{ p: 2 }}>
						<Typography variant="h6" gutterBottom>Weekly Insights</Typography>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<Grid container spacing={2} sx={{ mb: 2 }}>
								<Grid item>
									<DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
								</Grid>
								<Grid item>
									<DatePicker label="End Date" value={endDate} onChange={setEndDate} />
								</Grid>
							</Grid>
						</LocalizationProvider>
					</Paper>
				</Grid>
				<Grid item xs={12} sx={{ overflowX: 'auto' }}>
					{postingFrequencyData.length > 0 ? (
						<FrequencyHeatmap data={postingFrequencyData} title="Job Posting Frequency" colorScheme="greens" />
					) : (
						<Paper sx={{ p: 2, textAlign: 'center' }}>
							<Typography>No job posting data available for the selected period.</Typography>
						</Paper>
					)}
				</Grid>
				<Grid item xs={12} sx={{ overflowX: 'auto' }}>
					{applicationFrequencyData.length > 0 ? (
						<FrequencyHeatmap data={applicationFrequencyData} title="Job Application Frequency" colorScheme="blues" />
					) : (
						<Paper sx={{ p: 2, textAlign: 'center' }}>
							<Typography>No job application data available for the selected period.</Typography>
						</Paper>
					)}
				</Grid>
			</Grid>
		</Box>
	);
};

export default DailyApplication;
