import React, { useMemo } from "react";
import { Paper, Box } from "@mui/material";
import { calculateJobScores } from "@configs/jobScore";
import HorizontalScoreBar from "./HorizontalScoreBar";

const MatchPanel = ({ job, userSkills }) => {
	const scores = useMemo(() => calculateJobScores(job, userSkills), [job, userSkills]);
	const bidEst =
		scores.estimateApplicantNumber >= 200 ? "200+" : String(scores.estimateApplicantNumber);

	return (
		<Paper
			variant="outlined"
			sx={{
				p: { xs: 0.85, sm: 0.65 },
				width: "100%",
				minWidth: 0,
				borderTopLeftRadius: { xs: 1, sm: 0 },
				borderBottomLeftRadius: { xs: 1, sm: 0 },
				borderLeft: { xs: "1px solid", sm: "none" },
				borderColor: "divider",
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				justifyContent: "center",
				height: { sm: "100%" },
				gap: 0.75,
			}}
		>
			<HorizontalScoreBar
				value={scores.overallScore}
				label="OVR"
				prominent
				barHeight={8}
				labelWidth={40}
			/>

			<Box sx={{ display: "flex", flexDirection: "column", gap: 0.55, width: "100%" }}>
				<HorizontalScoreBar value={scores.skillMatch} label="Skill" barHeight={6} labelWidth={40} />
				<HorizontalScoreBar
					value={scores.applicantScore}
					label="Bid"
					subLabel={`est ${bidEst}`}
					barHeight={6}
					labelWidth={40}
				/>
				<HorizontalScoreBar value={scores.postedDateScore} label="Fresh" barHeight={6} labelWidth={40} />
				<HorizontalScoreBar value={scores.salaryScore} label="Sal" barHeight={6} labelWidth={40} />
			</Box>
		</Paper>
	);
};

export default MatchPanel;
