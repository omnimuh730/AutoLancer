
import React, { useRef, useState } from 'react';
import {
	Box,
	Button,
	IconButton,
	Stack,
	ButtonGroup,
	Popper,
	Paper,
	ClickAwayListener,
	MenuList,
	MenuItem,
	Grow,
	Chip
} from "@mui/material";
import {
	LinkedIn,
	ArrowDropDown,
	Visibility,
	Cancel
} from '@mui/icons-material';
import { useApplier } from '../../../../context/ApplierContext.jsx';
import { normalizeLeverApplyUrl } from '../../../../utils/applyLink.js';

const JobCardActions = ({ applyLink, onViewDetails, onApply, onUpdateStatus, onUnapply, job }) => {
	const { applier } = useApplier();
	const hasNonAbcApplier = Array.isArray(job.status)
		&& job.status.some(s => s.applier === applier?._id);

	const options = !job.status || !hasNonAbcApplier
		? ['Apply']
		: job.status.some(s => !s.scheduledDate && !s.declinedDate)
			? ['Declined', 'Scheduled']
			: [];

	const [open, setOpen] = useState(false);
	const anchorRef = useRef(null);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const selectedOption = options[selectedIndex] ?? options[0] ?? null;
	const showSplitActions = Array.isArray(job.status) && job.status.some(
		s => !(s.declinedDate || s.scheduledDate) && s.applier === applier?._id
	);
	const isApplyAction = selectedOption === 'Apply';
	const applyHref = React.useMemo(() => {
		if (!applyLink) {
			return '#';
		}
		if (applyLink.includes("linkedin.com")) {
			const title = job?.title ?? '';
			const companyName = job?.company?.name ?? '';
			const querySource = `${companyName} career ${title}`.trim();
			const query = querySource ? querySource.replace(/\s+/g, "+") : "linkedin";
			return `https://www.google.com/search?q=${query}`;
		}
		return normalizeLeverApplyUrl(applyLink);
	}, [applyLink, job?.company?.name, job?.title]);

	const handleApplyClick = (event) => {
		const isModifiedClick = event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1;

		if (!isModifiedClick) {
			event.preventDefault();
		}

		ApplyNow();

		if (!applyLink || isModifiedClick) {
			return;
		}

		window.open(applyHref, "_blank", "noopener,noreferrer");
	};

	const handleMenuItemClick = (event, index) => {
		setSelectedIndex(index);
		setOpen(false);
		if (options[index] === 'Declined' || options[index] === 'Scheduled') {
			if (onUpdateStatus) {
				onUpdateStatus(job, options[index]);
			}
		}
	};

	const handleToggle = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setOpen((prevOpen) => !prevOpen);
	};

	const handleClose = (event) => {
		if (anchorRef.current && event && anchorRef.current.contains(event.target)) {
			return;
		}
		setOpen(false);
	};

	React.useEffect(() => {
		if (!showSplitActions) {
			setOpen(false);
		}
	}, [showSplitActions]);

	const ApplyNow = async () => {
		try {
			if (onApply && job) {
				await onApply(job);
			}
		} catch (e) {
			// ignore error and still open the tab
			console.error(e);

		}
	}
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				mt: 2,
				flexWrap: "wrap",
				gap: 1,
			}}
		>
			<Chip color='success' label={job.postedAt ? `Posted at ${new Date(job.postedAt).toLocaleDateString()} ${new Date(job.postedAt).toLocaleTimeString()}` : ''} />
			<Stack direction="row" spacing={1} alignItems="center">
				<IconButton
					onClick={onViewDetails}
					sx={{ border: "1px solid", borderColor: "grey.300" }}
				>
					<Visibility fontSize="small" />
				</IconButton>
				{Array.isArray(job.status) && job.status.some(
					s => (s.declinedDate || s.scheduledDate) && s.applier === applier?._id
				) ? (
					<IconButton sx={{ borderRadius: "20px" }} size="small" color='error' variant='contained' onClick={() => onUpdateStatus(job, 'Applied')}>
						<Cancel />
					</IconButton>
				) : (
					<>
						{selectedOption && (isApplyAction ? (
							<Button
								component="a"
								href={applyHref}
								target="_blank"
								rel="noopener noreferrer"
								onClick={handleApplyClick}
								variant="contained"
								color="primary"
								sx={{
									borderRadius: "999px",
									textTransform: "none",
									px: 2.5,
									minHeight: 36,
									gap: 0.75,
								}}
							>
								{applyLink?.includes("linkedin.com") && (
									<LinkedIn fontSize="small" />
								)}
								Apply
							</Button>
						) : showSplitActions ? (
							<>
								<ButtonGroup
									ref={anchorRef}
									variant="outlined"
									color="primary"
									disableElevation
									sx={{
										borderRadius: "999px",
										overflow: "hidden",
										'& .MuiButtonGroup-grouped': {
											textTransform: "none",
											px: 2,
											fontWeight: 500,
											borderColor: (theme) => theme.palette.primary.main,
											color: (theme) => theme.palette.primary.main,
										},
										'& .MuiButtonGroup-grouped:first-of-type': {
											borderTopLeftRadius: "999px",
											borderBottomLeftRadius: "999px",
										},
										'& .MuiButtonGroup-grouped:last-of-type': {
											borderTopRightRadius: "999px",
											borderBottomRightRadius: "999px",
										},
										'& .MuiButtonGroup-grouped:not(:last-of-type)': {
											borderRightColor: (theme) => theme.palette.primary.main,
										},
									}}
								>
									<Button
										onClick={() => onUpdateStatus && onUpdateStatus(job, selectedOption)}
										sx={{
											bgcolor: (theme) => theme.palette.action.selected,
											'&:hover': {
												bgcolor: (theme) => theme.palette.action.hover,
											},
										}}
									>
										{selectedOption}
									</Button>
									<Button
										size="small"
										aria-controls={open ? 'split-button-menu' : undefined}
										aria-expanded={open ? 'true' : undefined}
										aria-label="Select job status"
										aria-haspopup="menu"
										onMouseDown={(event) => event.preventDefault()}
										onClick={handleToggle}
										sx={{
											minWidth: 38,
											px: 0.75,
										}}
									>
										<ArrowDropDown />
									</Button>
								</ButtonGroup>
								<Button
									size='small'
									color='error'
									sx={{ borderRadius: "20px", textTransform: "none" }}
									onClick={() => onUnapply(job)}
								>
									<Cancel />
								</Button>
							</>
						) : (
							<Button
								onClick={() => onUpdateStatus && onUpdateStatus(job, selectedOption)}
								sx={{ borderRadius: "20px", textTransform: "none" }}
							>
								{selectedOption}
							</Button>
						))}
					</>
				)}
				<Popper
					sx={{ zIndex: 1 }}
					open={open}
					anchorEl={anchorRef.current}
					role={undefined}
					transition
					disablePortal
				>
					{({ TransitionProps, placement }) => (
						<Grow
							{...TransitionProps}
							style={{
								transformOrigin:
									placement === 'bottom' ? 'center top' : 'center bottom',
							}}
						>
							<Paper>
								<ClickAwayListener onClickAway={handleClose}>
									<MenuList id="split-button-menu" autoFocusItem>
										{options.map((option, index) => (
											<MenuItem
												key={option}
												selected={index === selectedIndex}
												onClick={(event) => handleMenuItemClick(event, index)}
											>
												{option}
											</MenuItem>
										))}
									</MenuList>
								</ClickAwayListener>
							</Paper>
						</Grow>
					)}
				</Popper>

			</Stack>
		</Box>
	);
};

export default JobCardActions;
