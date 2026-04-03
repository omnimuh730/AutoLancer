
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
				p: { xs: 1, sm: 1.25 },
				width: "100%",
				minWidth: 0,
				borderTopLeftRadius: { xs: 1, md: 0 },
				borderBottomLeftRadius: { xs: 1, md: 0 },
				borderLeft: { xs: "1px solid", md: "none" },
				borderColor: "divider",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: { md: "100%" },
			}}
		>
			{/* Overall Score — compact to leave room for job details */}
			<Box sx={{ mb: 0.5, textAlign: "center" }}>
				<CircularProgressWithLabel value={scores.overallScore} size={36} thickness={4} />
				<Typography variant="caption" fontWeight="bold" sx={{ mt: 0.5, display: "block", letterSpacing: 0.02 }}>
					OVERALL SCORE
				</Typography>
			</Box>

			{/* 2x2 Grid for Sub-Metrics */}
			<Grid container spacing={0.5} sx={{ width: "100%" }}>
				<Grid size={{ xs: 6 }}>
					<MetricItem label="Skill" score={scores.skillMatch} />
				</Grid>
				<Grid size={{ xs: 6 }}>
					<MetricItem label={`Bid.Est ${scores.estimateApplicantNumber >= 200 ? "200+" : scores.estimateApplicantNumber}`} score={scores.applicantScore} />
				</Grid>
				<Grid size={{ xs: 6 }}>
					<MetricItem label="Freshness" score={scores.postedDateScore} />
				</Grid>
				<Grid size={{ xs: 6 }}>
					<MetricItem label="Salary" score={scores.salaryScore} />
				</Grid>
			</Grid>
		</Paper>
	);
};

export default MatchPanel;
