import * as React from 'react';
import { Autocomplete, TextField, createFilterOptions, Chip, Button, Stack, IconButton } from '@mui/material';

import {
	Face
} from '@mui/icons-material';

import LogoutIcon from '@mui/icons-material/Logout';
import useApi from '../api/useApi';
import { useApplier } from '../context/ApplierContext.jsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const filter = createFilterOptions();

export default function NameCombobox() {
	const { applier, setApplier } = useApplier();
	const { user: authUser, signout } = useAuth();
	const { get, post } = useApi();
	const navigate = useNavigate();
	const [users, setUsers] = React.useState([]); // [{ _id, name }]

	const setMainUser = React.useCallback((user) => setApplier(user), [setApplier]);

	// Set authenticated user as applier when available
	React.useEffect(() => {
		if (authUser && (!applier || applier.name !== authUser.name)) {
			setApplier(authUser);
		}
	}, [authUser, applier, setApplier]);

	// Fetch users once
	React.useEffect(() => {
		const fetchUsers = async () => {
			try {
				const data = await get('account_info');
				const list = Array.isArray(data) ? data : [];
				setUsers(list);
				// If authenticated user exists, use it; otherwise use first user
				if (!applier) {
					if (authUser) {
						const foundUser = list.find(u => u.name === authUser.name);
						if (foundUser) {
							setMainUser(foundUser);
						} else {
							setMainUser(authUser);
						}
					} else if (list.length) {
						setMainUser(list[0]);
					}
				}
			} catch (e) {
				console.error('Error fetching account info:', e);
			}
		};
		fetchUsers();
	}, [get, setMainUser, applier, authUser]);

	const ensureUserExists = async (name) => {
		const existing = users.find(u => u.name.toLowerCase() === String(name).toLowerCase());
		if (existing) return existing;
		try {
			const res = await post('account_info', { name });
			const insertedId = res?.insertedId || res?.insertedId?._id || res?.insertedId?.$oid || res?.insertedId;
			if (!insertedId) throw new Error('No insertedId');
			const user = { _id: insertedId, name };
			setUsers(prev => [...prev, user]);
			return user;
		} catch (e) {
			console.error('Error adding name:', e);
			return null;
		}
	};

	const handleSignOut = () => {
		signout();
		navigate('/signin');
	};

	if (authUser) {
		return (
			<Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 2 }}>
				<Chip icon={<Face />} label={authUser.name} color='success' />
				<IconButton onClick={handleSignOut}>
					<LogoutIcon />
				</IconButton>
			</Stack>
		);
	}

	return (
		<Autocomplete
			value={applier || null}
			onChange={async (event, newValue) => {
				if (typeof newValue === 'string') {
					const created = await ensureUserExists(newValue.trim());
					if (created) setMainUser(created);
				} else if (newValue && newValue.inputValue) {
					const created = await ensureUserExists(newValue.inputValue.trim());
					if (created) setMainUser(created);
				} else {
					setMainUser(newValue || null);
				}
			}}
			filterOptions={(options, params) => {
				const filtered = filter(options, { ...params, stringify: (o) => o.name });
				const { inputValue } = params;
				const isExisting = options.some(o => o.name.toLowerCase() === inputValue.toLowerCase());
				if (inputValue !== '' && !isExisting) {
					filtered.push({ inputValue, name: `Add "${inputValue}"` });
				}
				return filtered;
			}}
			selectOnFocus
			clearOnBlur
			handleHomeEndKeys
			options={users}
			getOptionLabel={(option) => {
				if (typeof option === 'string') return option;
				if (option.inputValue) return option.name; // Add "..."
				return option?.name || '';
			}}
			isOptionEqualToValue={(opt, val) => (opt?._id && val?._id ? String(opt._id) === String(val._id) : opt?.name === val?.name)}
			renderInput={(params) => (
				<TextField
					{...params}
					label="Find or Add User"
					placeholder="Select a user"
				/>
			)}
			sx={{ width: 300, ml: 2 }}
		/>
	);
}

