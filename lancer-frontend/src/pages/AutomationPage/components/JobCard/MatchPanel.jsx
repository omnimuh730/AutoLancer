import React, { useMemo } from "react";
import { Box, Divider, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { calculateJobScores } from "@configs/jobScore";
import HorizontalScoreBar from "./HorizontalScoreBar";

const MatchPanel = ({ job, userSkills }) => {
	const scores = useMemo(() => calculateJobScores(job, userSkills), [job, userSkills]);
	const bidEst =
		scores.estimateApplicantNumber >= 200 ? "200+" : String(scores.estimateApplicantNumber);

	return (
		<Box
			component="section"
			aria-label="Match scores"
			sx={{
				p: { xs: 1.25, sm: 1.5, md: 1.75 },
				width: "100%",
				minWidth: 0,
				height: { sm: "100%" },
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				justifyContent: "center",
				gap: { xs: 0.75, sm: 1 },
				bgcolor: "transparent",
				border: "none",
				boxShadow: "none",
			}}
		>
			<HorizontalScoreBar value={scores.overallScore} label="OVR" prominent />

			<Divider
				flexItem
				sx={{
					borderColor: (t) => alpha(t.palette.divider, 0.55),
					my: { xs: 0.15, sm: 0.25 },
				}}
			/>

			<Stack spacing={{ xs: 0.35, sm: 0.5 }} sx={{ width: "100%" }}>
				<HorizontalScoreBar value={scores.skillMatch} label="Skill" />
				<HorizontalScoreBar value={scores.applicantScore} label="Bid" badgeContent={bidEst} />
				<HorizontalScoreBar value={scores.postedDateScore} label="Fresh" />
				<HorizontalScoreBar value={scores.salaryScore} label="Sal" />
			</Stack>
		</Box>
	);
};

export default MatchPanel;
