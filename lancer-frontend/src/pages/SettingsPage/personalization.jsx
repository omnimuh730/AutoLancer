import React, { useEffect, useState } from 'react';
import { Box, Chip, Typography, CircularProgress, Stack, Pagination, FormControl, Select, MenuItem, TextField, InputAdornment, Button } from '@mui/material';
import {
	SearchRounded
} from '@mui/icons-material';
import useApi from '../../api/useApi';
import useNotification from '../../api/useNotification';

const PersonalizationPage = () => {
	const { get, post } = useApi();
	const notification = useNotification();
	const [allSkills, setAllSkills] = useState([]);
	const [userSkills, setUserSkills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(100);
	const [totalPages, setTotalPages] = useState(1);
	const [sort, setSort] = useState('name_asc');
	const [search, setSearch] = useState('');

	// Fetch all skills from skills category with pagination and sorting
	useEffect(() => {
		const fetchSkills = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams({ sort, page, limit });
				if (search && search.trim().length > 0) params.set('q', search.trim());
				const res = await get(`/skills-category?${params.toString()}`);
				if (res && res.success && Array.isArray(res.skills)) {
					setAllSkills([...new Set(res.skills)]);
					const newTotalPages = res.pagination?.totalPages || 1;
					if (newTotalPages !== totalPages) {
						setTotalPages(newTotalPages);
						if (page > newTotalPages) {
							setPage(newTotalPages);
						}
					}
				}
			} catch (err) {
				notification.error('Failed to fetch all skills');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};
		fetchSkills();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [get, page, limit, sort, search]);

	// Fetch user skills
	useEffect(() => {
		const fetchUserSkills = async () => {
			try {
				const res = await get('/personal/skills');
				if (res && res.success && Array.isArray(res.skills)) {
					setUserSkills(res.skills);
				}
			} catch (err) {
				notification.error('Failed to fetch user skills');
				console.error(err);
			}
		};
		fetchUserSkills();
	}, [get, notification]);

	// Toggle skill
	const handleToggleSkill = async (skill) => {
		setUpdating(true);
		try {
			let nextSkills;
			if (userSkills.includes(skill)) {
				// Remove skill
				nextSkills = userSkills.filter(s => s !== skill);
			} else {
				// Add skill
				nextSkills = [...userSkills, skill];
			}
			// Update backend (send full array)
			const res = await post('/personal/skills/update', { skills: nextSkills });
			if (res && res.success && Array.isArray(res.skills)) {
				setUserSkills(res.skills);
				notification.success('Skills updated');
			} else {
				notification.error('Failed to update skills');
			}
		} catch (err) {
			notification.error('Failed to update skills');
			console.error(err);
		}
		setUpdating(false);
	};

	const handleOwnAllSkills = async () => {
		setUpdating(true);
		try {
			const skillsToAdd = allSkills.filter(skill => !userSkills.includes(skill));
			if (skillsToAdd.length === 0) {
				notification.info('You already have all skills on this page.');
				setUpdating(false);
				return;
			}
			const nextSkills = [...userSkills, ...skillsToAdd];
			const res = await post('/personal/skills/update', { skills: nextSkills });
			if (res && res.success && Array.isArray(res.skills)) {
				setUserSkills(res.skills);
				notification.success('All skills on this page have been added to your profile.');
			} else {
				notification.error('Failed to update skills');
			}
		} catch (err) {
			notification.error('Failed to update skills');
			console.error(err);
		}
		setUpdating(false);
	};

	const handleReleaseAllSkills = async () => {
		setUpdating(true);
		try {
			const skillsToRelease = allSkills.filter(skill => userSkills.includes(skill));
			if (skillsToRelease.length === 0) {
				notification.info('You do not have any skills on this page to release.');
				setUpdating(false);
				return;
			}
			const nextSkills = userSkills.filter(skill => !skillsToRelease.includes(skill));
			const res = await post('/personal/skills/update', { skills: nextSkills });
			if (res && res.success && Array.isArray(res.skills)) {
				setUserSkills(res.skills);
				notification.success('All skills on this page have been removed from your profile.');
			} else {
				notification.error('Failed to update skills');
			}
		} catch (err) {
			notification.error('Failed to update skills');
			console.error(err);
		}
		setUpdating(false);
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" fontWeight="bold" gutterBottom>Personalize Your Skills</Typography>
			<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
				<TextField
					value={search}
					onChange={e => { setSearch(e.target.value); setPage(1); }}
					placeholder="Search skills..."
					size="small"
					variant="outlined"
					sx={{ minWidth: 220 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchRounded color="action" />
							</InputAdornment>
						),
					}}
				/>
				<FormControl size="small" sx={{ minWidth: 120 }}>
					<Select value={sort} onChange={e => setSort(e.target.value)}>
						<MenuItem value="name_asc">A-Z</MenuItem>
						<MenuItem value="name_desc">Z-A</MenuItem>
					</Select>
				</FormControl>
				<FormControl size="small" sx={{ minWidth: 100 }}>
					<Select value={limit} onChange={e => setLimit(Number(e.target.value))}>
						<MenuItem value={50}>50</MenuItem>
						<MenuItem value={100}>100</MenuItem>
						<MenuItem value={250}>250</MenuItem>
						<MenuItem value={500}>500</MenuItem>
					</Select>
				</FormControl>
				<Button onClick={handleOwnAllSkills} variant="contained" disabled={updating || loading}>Own all skills</Button>
				<Button onClick={handleReleaseAllSkills} variant="contained" disabled={updating || loading}>Release all skills</Button>
			</Stack>
			{loading ? (
				<CircularProgress />
			) : (
				<>
					<Stack direction="row" flexWrap="wrap" gap={1}>
						{allSkills.map(skill => (
							<Chip
								key={skill}
								label={skill}
								color={userSkills.includes(skill) ? 'primary' : 'default'}
								variant={userSkills.includes(skill) ? 'filled' : 'outlined'}
								clickable
								disabled={updating}
								onClick={() => handleToggleSkill(skill)}
							/>
						))}
					</Stack>
					<Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
						<Pagination
							count={totalPages}
							page={page}
							onChange={(e, value) => setPage(value)}
							color="primary"
							size="medium"
						/>
					</Box>
				</>
			)}
		</Box>
	);
};

export default PersonalizationPage;