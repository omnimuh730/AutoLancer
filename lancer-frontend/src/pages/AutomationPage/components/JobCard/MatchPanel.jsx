
import React, { useMemo } from 'react';
import { Paper, Box, Typography, Grid } from "@mui/material";
import { calculateJobScores } from '../../../../../../configs/jobScore';
import CircularProgressWithLabel from './CircularProgressWithLabel';
import MetricItem from './MetricItem';

const MatchPanel = ({ job, userSkills }) => {
	const scores = useMemo(() => calculateJobScores(job, userSkills), [job, userSkills]);

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				borderTopLeftRadius: 0,
				borderBottomLeftRadius: 0,
				borderLeft: "none",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%", // Ensure consistent height
			}}
		>
			{/* Overall Score */}
			<Box sx={{ mb: 1.5, textAlign: "center" }}>
				<CircularProgressWithLabel value={scores.overallScore} size={60} thickness={5} />
				<Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>
					OVERALL SCORE
				</Typography>
			</Box>

			{/* 2x2 Grid for Sub-Metrics */}
			<Grid container spacing={1}>
				<Grid size={{ md: 6 }}>
					<MetricItem label="Skill" score={scores.skillMatch} />
				</Grid>
				<Grid size={{ md: 6 }}>
					<MetricItem label={`Bid.Est ${scores.estimateApplicantNumber >= "200" ? "200+" : scores.estimateApplicantNumber}`} score={scores.applicantScore} />
				</Grid>
				<Grid size={{ md: 6 }}>
					<MetricItem label="Freshness" score={scores.postedDateScore} />
				</Grid>
				<Grid size={{ md: 6 }}>
					<MetricItem label="Salary" score={scores.salaryScore} />
				</Grid>
			</Grid>
		</Paper>
	);
};

export default MatchPanel;
