import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Horizontal bar (0–100). Fills from the left.
 */
export default function HorizontalScoreBar({
	value,
	label,
	subLabel,
	barHeight = 5,
	showValue = true,
	labelWidth = 40,
	prominent = false,
}) {
	const n = value == null || Number.isNaN(Number(value)) ? null : Number(value);
	const pct = n == null ? 0 : Math.min(100, Math.max(0, n));

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 0.65,
				minWidth: 0,
				width: "100%",
			}}
		>
			<Box
				sx={{
					width: labelWidth,
					flexShrink: 0,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				{label ? (
					<Typography
						variant="caption"
						sx={{
							fontSize: prominent ? "0.9375rem" : "0.8125rem",
							fontWeight: prominent ? 800 : 700,
							lineHeight: 1.15,
							letterSpacing: prominent ? 0.04 : 0,
							color: prominent ? "text.secondary" : "text.primary",
						}}
					>
						{label}
					</Typography>
				) : null}
				{subLabel != null && subLabel !== "" ? (
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.75rem",
							lineHeight: 1.15,
							color: "text.secondary",
						}}
					>
						{subLabel}
					</Typography>
				) : null}
			</Box>
			<Box
				sx={{
					flex: 1,
					minWidth: 0,
					height: prominent ? 8 : barHeight,
					borderRadius: 0.5,
					bgcolor: "action.hover",
					position: "relative",
					overflow: "hidden",
					border: "1px solid",
					borderColor: "divider",
				}}
			>
				<Box
					sx={{
						position: "absolute",
						left: 0,
						top: 0,
						bottom: 0,
						width: `${pct}%`,
						bgcolor: "primary.main",
						transition: "width 0.2s ease",
					}}
				/>
			</Box>
			{showValue ? (
				<Typography
					variant="caption"
					sx={{
						width: prominent ? 44 : 36,
						flexShrink: 0,
						textAlign: "right",
						fontSize: prominent ? "1.375rem" : "1rem",
						fontWeight: prominent ? 800 : 700,
						lineHeight: 1.05,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{n == null ? "—" : Math.round(n)}
				</Typography>
			) : null}
		</Box>
	);
}
