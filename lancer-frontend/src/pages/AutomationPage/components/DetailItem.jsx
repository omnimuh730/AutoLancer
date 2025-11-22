import React from "react";
import { Box, Typography } from "@mui/material";

const DetailItem = ({ icon, text }) =>
	text ? (
		<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
			{icon}
			<Typography variant="body2" color="text.secondary">
				{text}
			</Typography>
		</Box>
	) : null;

export default DetailItem;
