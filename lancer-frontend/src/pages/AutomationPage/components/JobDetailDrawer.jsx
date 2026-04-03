import React, { useState, useEffect } from "react";
import {
	Drawer,
	Box,
	IconButton,
	Typography,
	Divider,
	Stack,
	Button,
	Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import useApi from '../../../api/useApi';
import useNotification from '../../../api/useNotification';

const getJobIdStr = (j) => {
	if (!j) return '';
	const id = j._id || j.id;
	if (!id) return '';
	return typeof id === 'object' && id.$oid ? id.$oid : String(id);
};

const JobDetailDrawer = ({ job, open, onClose, onSkillsChanged }) => {
	const [skillsChanged, setSkillsChanged] = useState(false);
	const { get } = useApi(import.meta.env.VITE_API_URL);
	const [displayJob, setDisplayJob] = useState(null);

	useEffect(() => {
		if (!job) {
			setDisplayJob(null);
			return;
		}
		setDisplayJob(job);
	}, [job]);

	useEffect(() => {
		if (!open || !job) return;
		const idStr = getJobIdStr(job);
		if (!idStr) return;
		if (typeof job.description === 'string' && job.description.length > 0) return;

		let cancelled = false;
		(async () => {
			try {
				const res = await get(`/jobs/${idStr}`);
				if (cancelled || !res?.success || !res.data) return;
				setDisplayJob((prev) => (prev ? { ...prev, ...res.data } : res.data));
			} catch (e) {
				console.warn('Failed to load full job for drawer', e);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, job, get]);

	// Wrap onClose to notify parent if skills changed
	const handleClose = () => {
		onClose && onClose();
		if (skillsChanged && onSkillsChanged) {
			onSkillsChanged();
			setSkillsChanged(false);
		}
	};

	if (!job) return null;

	const j = displayJob ?? job;

	return (
		<Drawer anchor="right" open={open} onClose={handleClose}>
			<Box
				sx={{
					width: { xs: "100vw", sm: 500, md: 1000 },
					p: 5,
					pt: 15,
					position: "relative",
					height: "100%",
				}}
			>
				<IconButton
					onClick={handleClose}
					sx={{ position: "absolute", top: 16, right: 16 }}
				>
					<CloseIcon />
				</IconButton>

				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="h5" fontWeight="bold">
						{j.title}
					</Typography>
					{j.applied ? <Chip label="Applied" size="small" color="success" icon={<CheckIcon />} /> : null}
				</Stack>
				<Typography variant="body1" color="text.secondary" gutterBottom>
					{j.company?.name} &middot; {(j.details && (j.details.location || j.details.position))}
				</Typography>
				{/* Company tags */}
				{Array.isArray(j.company?.tags) && j.company.tags.length > 0 && (
					<Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
						{j.company.tags.map(t => (
							<Chip key={t} label={t} size="small" variant="outlined" />
						))}
					</Stack>
				)}
				<Divider sx={{ my: 2 }} />

				{/* Skill tags - clickable toggle chips */}
				{Array.isArray(j.skills) && j.skills.length > 0 && (
					<SkillChips skills={j.skills} onSkillsChanged={() => setSkillsChanged(true)} />
				)}
				<Divider sx={{ my: 2 }} />
				<Typography variant="h6" gutterBottom>
					<a href={j.applyLink}>Job Link</a>
				</Typography>
				<Divider sx={{ my: 2 }} />

				<Box sx={{ overflowY: "auto", height: "calc(100% - 150px)" }}>
					{typeof j.description === 'string' && /<\w+.*?>/.test(j.description) ? (
						// If description contains HTML tags, render as HTML
						<Box dangerouslySetInnerHTML={{ __html: j.description }} />
					) : (
						// Plain text - preserve newlines
						<Box sx={{ whiteSpace: 'pre-line' }}>{j.description}</Box>
					)}
				</Box>
			</Box>
		</Drawer>
	);
};

export default JobDetailDrawer;

// Small internal component to handle clickable/toggleable skill chips
const SkillChips = ({ skills = [], onSkillsChanged }) => {
	const { get, post } = useApi();
	const notification = useNotification();
	const [selected, setSelected] = useState(() => new Set());
	const [updating, setUpdating] = useState(false);

	// Fetch saved skills on mount
	useEffect(() => {
		const fetchUserSkills = async () => {
			try {
				const res = await get('/personal/skills');
				if (res && res.success && Array.isArray(res.skills)) {
					setSelected(new Set(res.skills));
				} else if (res && res.success && !Array.isArray(res.skills)) {
					console.warn('GET /api/personal/skills response data.skills is not an array:', res.skills);
					setSelected(new Set()); // Reset to empty set if data.skills is not an array
				}
			} catch (err) {
				notification.error('Failed to fetch user skills');
				console.error('Error fetching user skills:', err);
			}
		};
		fetchUserSkills();
	}, [get, notification]);

	// Toggle skill
	const toggle = async (skill) => {
		if (updating) return; // Prevent concurrent toggles
		setUpdating(true);
		try {
			let nextSkills;
			if (selected.has(skill)) {
				// Remove skill
				nextSkills = Array.from(selected).filter(s => s !== skill);
			} else {
				// Add skill
				nextSkills = [...Array.from(selected), skill];
			}
			// Update backend (send full array)
			const res = await post('/personal/skills/update', { skills: nextSkills });
			if (res && res.success && Array.isArray(res.skills)) {
				setSelected(new Set(res.skills));
				if (onSkillsChanged) onSkillsChanged();
				notification.success('Skills updated');
			} else {
				notification.error('Failed to update skills');
			}
		} catch (err) {
			notification.error('Failed to update skills');
			console.error('Error updating skills:', err);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
			{skills.map(s => {
				const isSelected = selected.has(s);
				return (
					<Chip
						key={s}
						label={s}
						size="small"
						variant={isSelected ? 'filled' : 'outlined'}
						color={isSelected ? 'primary' : 'error'}
						onClick={() => toggle(s)}
						disabled={updating}
						icon={isSelected ? <CheckIcon sx={{ color: 'white' }} /> : <CancelIcon />}
						sx={{ cursor: updating ? 'wait' : 'pointer', opacity: updating ? 0.7 : 1 }}
					/>
				);
			})}
		</Stack>
	);
};

/** 
{
	"applyLink": "https://benefis.wd1.myworkdayjobs.com/bhs/job/Remote-USA/Interface-Engineer--Exempt-_JR104744",
		"id": 1757698370903,
			"postedAgo": "32 minutes ago",
				"tags": [
					"98 applicants"
				],
					"company": {
		"name": "Benefis Health System",
			"tags": [
				"Health Care",
				"Hospital",
				"Non Profit",
				"Primary and Urgent Care"
			]
	},
	"title": "Interface Engineer (Exempt)",
		"details": {
		"position": "Remote USA",
			"time": "Full-time",
				"remote": "Remote",
					"seniority": "Mid, Senior Level",
						"date": "5+ years exp"
	},
	"applicants": {
		"count": 98,
			"text": "98 applicants"
	},
	"description": "Responsibilities\nResponsible for implementing integration techniques to link data between functions in separate applications, and for the translation of data between disparate systems.\nBuilds, configures, and tests interfaces using various technologies to connect and exchange data between information systems applications within the health system.\nEnhances, monitors, tests, and troubleshoots existing interfaces and interacts with ITS applications staff and end users to ensure existing systems are meeting end user needs and working effectively.\nMakes recommendation as to the use and the replacement or purchase of a new interface engine.\nDemonstrates the ability to deal with pressure to meet deadlines, to be accurate, and to handle constantly changing situations.\nDemonstrates the ability to deal with a variety of people, deal with stressful situations, and handle conflict.\nWill perform all job duties or job tasks as assigned.\nWill follow and adhere to all requirements, regulations and procedures of any licensing board or agency.\nMust comply with all Benefis Health System’s organization policies and procedures.\n\nQualification\nRepresents the skills you have\n\nFind out how your skills align with this job's requirements. If anything seems off, you can easily click on the tags to select or unselect skills to reflect your actual expertise.\n\nInterface development\nData integration\nHealth care experience\nTeam collaboration\nProject management\nRequired\nBachelor’s degree in Computer Science, Software Engineering or equivalent technical experience required.\nFive years’ experience in developing and maintaining interfaces required.\nAbility to work in a fast-paced environment and manage multiple projects.\nPreferred\nFive years’ experience in a health care environment preferred.\nExperience collaborating with and organizing large teams.",
		"_createdAt": "2025-09-12T17:32:50.927Z"
}
*/
