
import { Box, Avatar, Stack, Chip, Typography } from "@mui/material";

const JobCardHeader = ({ company }) => (
	<Box sx={{ display: "flex", alignItems: "start", mb: 1.5 }}>
		<Avatar
			src={company.logo || undefined}
			alt={`${company.name} logo`}
			variant="rounded"
			sx={{ width: 56, height: 56, mr: 2 }}
		>
			{!company.logo && company.name ? String(company.name).charAt(0).toUpperCase() : null}
		</Avatar>
		<Box sx={{ flexGrow: 1 }}>
			<Typography variant="h6" component="div" fontWeight="bold">
				{company.title}
			</Typography>
			<Typography variant="body1" color="text.secondary">
				{company.name}
			</Typography>

			{/* Company tags (if any) */}
			{Array.isArray(company.tags) && company.tags.length > 0 && (
				<Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
					{company.tags.map(t => (
						<Chip key={t} label={t} size="small" variant="outlined" />
					))}
				</Stack>
			)}
		</Box>
	</Box>
);

export default JobCardHeader;
