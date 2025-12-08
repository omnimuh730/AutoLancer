import {
	Card,
	CardContent,
	Typography,
	Stack,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemText
} from '@mui/material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const checklist = [
	{
		title: 'Open the target page',
		description: 'Navigate to Jobright (or your preferred job board) in the active tab so the extension can interact with it.'
	},
	{
		title: 'Log in if required',
		description: 'Complete any authentication steps beforehand; the automation only works with already signed-in sessions.'
	},
	{
		title: 'Keep the page focused',
		description: 'Leave the tab visible while scraping so highlights stay accurate and DOM mutations are detected properly.'
	},
	{
		title: 'Confirm filters',
		description: 'Apply any search filters (location, role, etc.) that you want the scraper to capture.'
	}
];

const SetupComponent = () => {
	return (
		<Card sx={{ maxWidth: 500, mx: 'auto', mt: 4, borderRadius: 3, boxShadow: 3 }}>
			<CardContent>
				<Stack spacing={2}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<CheckCircleOutlineIcon color="success" />
						<Typography variant="h5" component="h2">
							Setup Checklist
						</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary">
						Complete the following quick steps before starting an automated scrape. This keeps the workflow predictable
						and avoids brittle socket/connection requirements.
					</Typography>
					<Divider />
					<List dense>
						{checklist.map((item) => (
							<ListItem key={item.title} alignItems="flex-start">
								<ListItemIcon>
									<TipsAndUpdatesIcon color="primary" />
								</ListItemIcon>
								<ListItemText
									primary={item.title}
									secondary={item.description}
									secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
								/>
							</ListItem>
						))}
					</List>
					<Typography variant="body2" color="text.secondary">
						Once you&apos;re ready, move to the next step and trigger the scraping workflow.
					</Typography>
				</Stack>
			</CardContent>
		</Card>
	);
};

export default SetupComponent;
