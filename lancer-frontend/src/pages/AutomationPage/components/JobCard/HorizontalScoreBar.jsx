import React from "react";
import { Box, Typography, Chip, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * Horizontal bar (0–100). Fills from the left.
 * Optional badgeContent: estimated value shown as a compact chip beside the label (e.g. bid applicants).
 */
export default function HorizontalScoreBar({
	value,
	label,
	subLabel,
	badgeContent,
	barHeight,
	showValue = true,
	labelWidth,
	prominent = false,
}) {
	const theme = useTheme();
	const n = value == null || Number.isNaN(Number(value)) ? null : Number(value);
	const pct = n == null ? 0 : Math.min(100, Math.max(0, n));

	const trackH = prominent
		? { xs: 7, sm: 9, md: 10 }
		: barHeight != null
			? barHeight
			: { xs: 5, sm: 6, md: 7 };

	const badgeStr = badgeContent != null ? String(badgeContent) : "";
	const hasEstimateChip = badgeContent != null && badgeStr.length > 0;

	const labelCol =
		labelWidth != null
			? { width: labelWidth, flexShrink: 0 }
			: hasEstimateChip
				? {
						flex: "0 1 auto",
						minWidth: 0,
						maxWidth: { xs: "52%", sm: "48%", md: "44%" },
					}
				: {
						width: { xs: 44, sm: 52, md: 58 },
						flexShrink: 0,
					};

	const labelTypographySx = {
		fontSize: prominent
			? { xs: "0.875rem", sm: "0.9375rem", md: "1rem" }
			: { xs: "0.8125rem", sm: "0.875rem", md: "0.9375rem" },
		fontWeight: prominent ? 800 : 700,
		lineHeight: 1.2,
		letterSpacing: prominent ? 0.06 : 0.02,
		color: prominent ? "text.secondary" : "text.primary",
	};

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: { xs: 0.75, sm: 1, md: 1.25 },
				minWidth: 0,
				width: "100%",
				py: { xs: 0.1, sm: 0.15 },
			}}
		>
			<Box
				sx={{
					...labelCol,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				{label ? (
					hasEstimateChip ? (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: { xs: 0.65, sm: 0.75 },
								flexWrap: "nowrap",
								minWidth: 0,
							}}
						>
							<Typography variant="caption" component="span" sx={{ ...labelTypographySx, flexShrink: 0 }}>
								{label}
							</Typography>
							<Chip
								label={badgeContent}
								size="small"
								variant="outlined"
								color="primary"
								title="Estimated applicants at listing"
								aria-label={`Estimated applicants: ${badgeContent}`}
								sx={{
									height: { xs: 22, sm: 24 },
									maxWidth: "100%",
									flexShrink: 1,
									borderColor: alpha(theme.palette.primary.main, 0.35),
									bgcolor: alpha(theme.palette.primary.main, 0.06),
									"& .MuiChip-label": {
										px: { xs: 0.85, sm: 1 },
										fontSize: { xs: "0.68rem", sm: "0.72rem" },
										fontWeight: 700,
										fontVariantNumeric: "tabular-nums",
										lineHeight: 1.2,
									},
								}}
							/>
						</Box>
					) : (
						<Typography variant="caption" sx={labelTypographySx}>
							{label}
						</Typography>
					)
				) : null}
				{subLabel != null && subLabel !== "" && !hasEstimateChip ? (
					<Typography
						variant="caption"
						sx={{
							fontSize: { xs: "0.7rem", sm: "0.75rem" },
							lineHeight: 1.2,
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
					height: trackH,
					borderRadius: 100,
					bgcolor: alpha(theme.palette.grey[500], 0.14),
					position: "relative",
					overflow: "hidden",
					border: "1px solid",
					borderColor: alpha(theme.palette.divider, 0.9),
					boxShadow: `inset 0 1px 2px ${alpha(theme.palette.common.black, 0.06)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						left: 0,
						top: 0,
						bottom: 0,
						width: `${pct}%`,
						borderRadius: 100,
						background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
						transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
						boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
					}}
				/>
			</Box>
			{showValue ? (
				<Typography
					variant="caption"
					component="span"
					sx={{
						minWidth: { xs: 34, sm: 40, md: 44 },
						flexShrink: 0,
						textAlign: "right",
						fontSize: prominent
							? { xs: "1.25rem", sm: "1.35rem", md: "1.45rem" }
							: { xs: "0.9375rem", sm: "1rem", md: "1.0625rem" },
						fontWeight: prominent ? 800 : 700,
						lineHeight: 1.1,
						fontVariantNumeric: "tabular-nums",
						color: "text.primary",
					}}
				>
					{n == null ? "—" : Math.round(n)}
				</Typography>
			) : null}
		</Box>
	);
}
