import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
	Container,
	Box,
	TextField,
	Button,
	Typography,
	Paper,
	Alert,
	Stack
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import useNotification from '../../api/useNotification';

function SignUpPage() {
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { signup } = useAuth();
	const navigate = useNavigate();
	const notification = useNotification();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		if (!name || !password || !confirmPassword) {
			setError('Please fill in all fields');
			setLoading(false);
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			setLoading(false);
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			setLoading(false);
			return;
		}

		const result = await signup(name, password);
		setLoading(false);

		if (result.success) {
			notification.success('Account created successfully');
			navigate('/automation');
		} else {
			setError(result.message || 'Sign up failed');
			notification.error(result.message || 'Sign up failed');
		}
	};

	return (
		<Container maxWidth="sm" sx={{ mt: 8 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				<Stack spacing={3}>
					<Typography variant="h4" component="h1" align="center" gutterBottom>
						Sign Up
					</Typography>

					{error && <Alert severity="error">{error}</Alert>}

					<Box component="form" onSubmit={handleSubmit}>
						<Stack spacing={3}>
							<TextField
								label="Name"
								variant="outlined"
								fullWidth
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoFocus
							/>

							<TextField
								label="Password"
								type="password"
								variant="outlined"
								fullWidth
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								helperText="Must be at least 6 characters"
							/>

							<TextField
								label="Confirm Password"
								type="password"
								variant="outlined"
								fullWidth
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>

							<Button
								type="submit"
								variant="contained"
								fullWidth
								size="large"
								disabled={loading}
								sx={{ mt: 2 }}
							>
								{loading ? 'Creating account...' : 'Sign Up'}
							</Button>

							<Typography variant="body2" align="center">
								Already have an account?{' '}
								<Link to="/signin" style={{ textDecoration: 'none' }}>
									Sign in
								</Link>
							</Typography>
						</Stack>
					</Box>
				</Stack>
			</Paper>
		</Container>
	);
}

export default SignUpPage;

