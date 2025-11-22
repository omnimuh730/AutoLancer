
import React from 'react';
import { Box, Grid, Paper } from "@mui/material";
import {
	LocationOn,
	AccessTime,
	HomeWork,
	Leaderboard,
	CalendarToday,
	AttachMoney,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import DetailItem from "../DetailItem";

const Item = styled(Paper)(({ theme }) => ({
	backgroundColor: '#fff',
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: 'center',
	color: (theme.vars ?? theme).palette.text.secondary,
	...theme.applyStyles('dark', {
		backgroundColor: '#1A2027',
	}),
}));

const JobCardDetails = ({ details = {} }) => {
	// Normalize different keys that may come from backend
	const location = details.location || details.position || 'none';
	const isRemote = details.isRemote || (typeof details.remote === 'string' ? details.remote.toLowerCase() === 'remote' : !!details.remote);
	const type = details.type || details.time || 'None';
	const level = details.level || details.seniority || 'None';
	const experience = details.experience || details.date || 'None';
	const salary = details.money || 'None';

	return (
		<Box sx={{ flexGrow: 1 }}>
			<Grid container spacing={2}>
				<Grid size={{ xs: 'auto' }}>
					<Item>
						<DetailItem icon={<LocationOn fontSize="small" />} text={location} />
					</Item>
				</Grid>
				{isRemote && (
					<Grid size={{ xs: 'auto' }}>
						<Item>
							<DetailItem icon={<HomeWork fontSize="small" />} text={"Remote"} />
						</Item>
					</Grid>
				)}
				<Grid size={{ xs: 'auto' }}>
					<Item>
						<DetailItem icon={<AccessTime fontSize="small" />} text={type} />
					</Item>
				</Grid>
				<Grid size={{ xs: 'auto' }}>
					<Item>
						<DetailItem icon={<Leaderboard fontSize="small" />} text={level} />
					</Item>
				</Grid>
				<Grid size={{ xs: 'auto' }}>
					<Item>
						<DetailItem icon={<CalendarToday fontSize="small" />} text={experience} />
					</Item>
				</Grid>
				<Grid size={{ xs: 'auto' }}>
					<Item>
						<DetailItem icon={<AttachMoney fontSize="small" />} text={salary} />
					</Item>
				</Grid>
			</Grid>
		</Box>
	);
};

export default JobCardDetails;
