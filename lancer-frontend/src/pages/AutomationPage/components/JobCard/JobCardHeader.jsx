
import { Box, Avatar, Stack, Chip, Typography } from "@mui/material";

const JobCardHeader = ({ company }) => (
	<Box sx={{ display: "flex", alignItems: "start", mb: 0.75, minWidth: 0, width: "100%" }}>
		<Avatar
			src={company.logo || undefined}
			alt={`${company.name} logo`}
			variant="rounded"
			sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, mr: { xs: 1.5, sm: 2 }, flexShrink: 0 }}
		>
			{!company.logo && company.name ? String(company.name).charAt(0).toUpperCase() : null}
		</Avatar>
		<Box sx={{ flexGrow: 1, minWidth: 0 }}>
			<Typography variant="h6" component="div" fontWeight="bold" sx={{ wordBreak: "break-word", lineHeight: 1.3 }}>
				{company.title}
			</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ wordBreak: "break-word" }}>
				{company.name}
			</Typography>

			{/* Company tags (if any) */}
			{Array.isArray(company.tags) && company.tags.length > 0 && (
				<Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
					{company.tags.map(t => (
						<Chip key={t} label={t} size="small" variant="outlined" />
					))}
				</Stack>
			)}
		</Box>
	</Box>
);

export default JobCardHeader;
