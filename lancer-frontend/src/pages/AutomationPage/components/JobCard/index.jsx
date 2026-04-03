import React, { memo } from 'react';
import { Card, CardContent, Divider, Box, Grid, Checkbox } from "@mui/material";
import JobCardHeader from "./JobCardHeader";
import JobCardDetails from "./JobCardDetails";
import JobCardActions from "./JobCardActions";
import MatchPanel from "./MatchPanel";

const JobCard = ({ job, userSkills, onViewDetails, onApply, onUpdateStatus, onUnapply, checked, onCheck }) => (
	<Box
		sx={{
			display: 'flex',
			flexDirection: { xs: 'column', sm: 'row' },
			alignItems: { xs: 'stretch', sm: 'flex-start' },
			mb: 0.5,
			width: '100%',
			minWidth: 0,
			gap: { xs: 0.75, sm: 0 },
		}}
	>
		<Checkbox
			type="checkbox"
			checked={checked}
			onChange={e => onCheck && onCheck(e.target.checked)}
			sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}
		/>
		<Grid container spacing={0} component={Card} variant="outlined" sx={{ flexGrow: 1, minWidth: 0, width: '100%', overflow: 'hidden' }}>
			<Grid size={{ xs: 12, md: 8 }}
				sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}
			>
				<CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.25 }, pb: { xs: 1.5, sm: 1.75 }, "&:last-child": { pb: { xs: 1.5, sm: 1.75 } } }}>
					<JobCardHeader
						company={{
							...job.company,
							title: job.title,
						}}
					/>
					<Divider sx={{ my: 0.5 }} />
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
			<Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
				<MatchPanel job={job} userSkills={userSkills} />
			</Grid>
		</Grid>
	</Box>
);

export default memo(JobCard);
