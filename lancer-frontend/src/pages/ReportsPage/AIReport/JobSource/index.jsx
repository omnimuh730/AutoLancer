import React, { useEffect, useState, useMemo } from "react";
import useApi from "../../../../api/useApi";
import { useApplier } from "../../../../context/ApplierContext.jsx";
import { Box, CircularProgress, Typography } from "@mui/material";
import { JobSource as JobSourceList } from '../../../../../../configs/pub';
import JobSourceChart from "./JobSourceChart";
import { SCALING_POWER, SERIES_CONFIG } from "./constants";

const JobSource = () => {
	const { get } = useApi();
	const [rawData, setRawData] = useState([]);
	const { applier } = useApplier();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const q = applier?.name ? `?applierName=${encodeURIComponent(applier.name)}` : '';
				const response = await get(`/reports/job-source-summary${q}`);
				if (response.success) {
					setRawData(response.data || []);
				} else {
					setError(response.error || "Failed to fetch data");
				}

			} catch (err) {
				setError(err.message || "An error occurred");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [get, applier]);

	const chartData = useMemo(() => {
		if (!rawData) return { labels: [], series: [] };

		const sourceMap = new Map(JobSourceList.map(source => [source, {}]));

		rawData.forEach(item => {
			if (sourceMap.has(item.source)) {
				sourceMap.set(item.source, {
					postings: item.postings || 0,
					applied: item.applied || 0,
					scheduled: item.scheduled || 0,
					declined: item.declined || 0,
				});
			}
		});

		const labels = JobSourceList;
		const series = Object.keys(SERIES_CONFIG).map(key => {
			const originalData = labels.map(label => sourceMap.get(label)?.[key] || 0);
			const scaledData = originalData.map(value => Math.pow(value, SCALING_POWER));
			return {
				key,
				name: SERIES_CONFIG[key].name,
				originalData,
				scaledData,
			};
		});

		return { labels, series };
	}, [rawData]);

	if (loading) {
		return <CircularProgress />;
	}

	if (error) {
		return <Typography color="error">{error}</Typography>;
	}

	if (chartData.series.every(s => s.originalData.every(v => v === 0))) {
		return (
			<Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography>No job source data available.</Typography>
			</Box>
		);
	}

	return <JobSourceChart chartData={chartData} seriesConfig={SERIES_CONFIG} />;
};

export default JobSource;
