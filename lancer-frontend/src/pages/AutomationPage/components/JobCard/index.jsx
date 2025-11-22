
import React from 'react';
import { Card, CardContent, Divider, Box, Grid, Checkbox } from "@mui/material";
import JobCardHeader from "./JobCardHeader";
import JobCardDetails from "./JobCardDetails";
import JobCardActions from "./JobCardActions";
import MatchPanel from "./MatchPanel";

const JobCard = ({ job, userSkills, onViewDetails, onApply, onUpdateStatus, onUnapply, checked, onCheck }) => (
	<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
		<Checkbox
			type="checkbox"
			checked={checked}
			onChange={e => onCheck && onCheck(e.target.checked)}
		/>
		<Grid container spacing={0} component={Card} variant="outlined" sx={{ flexGrow: 1, overflow: 'hidden' }}>
			<Grid size={{ xs: 12, md: 9 }}
				sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
			>
				<CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
					<JobCardHeader
						company={{
							...job.company,
							title: job.title,
						}}
					/>
					<Divider sx={{ my: 1 }} />
					<JobCardDetails details={job.details} />
					<Box sx={{ mt: "auto" }}>
						<JobCardActions
							applicants={job.applicants}
							applyLink={job.applyLink}
							onViewDetails={() => onViewDetails(job)}
							onApply={onApply}
							onUpdateStatus={onUpdateStatus}
							onUnapply={onUnapply}
							job={job}
						/>
					</Box>
				</CardContent>
			</Grid>
			<Grid size={{ xs: 12, md: 3 }}>
				<MatchPanel job={job} userSkills={userSkills} />
			</Grid>
		</Grid>
	</Box>
);

export default JobCard;
