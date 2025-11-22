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

function SignInPage() {
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { signin } = useAuth();
	const navigate = useNavigate();
	const notification = useNotification();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		if (!name || !password) {
			setError('Please fill in all fields');
			setLoading(false);
			return;
		}

		const result = await signin(name, password);
		setLoading(false);

		if (result.success) {
			notification.success('Signed in successfully');
			navigate('/automation');
		} else {
			setError(result.message || 'Sign in failed');
			notification.error(result.message || 'Sign in failed');
		}
	};

	return (
		<Container maxWidth="sm" sx={{ mt: 8 }}>
			<Paper elevation={3} sx={{ p: 4 }}>
				<Stack spacing={3}>
					<Typography variant="h4" component="h1" align="center" gutterBottom>
						Sign In
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
							/>

							<Button
								type="submit"
								variant="contained"
								fullWidth
								size="large"
								disabled={loading}
								sx={{ mt: 2 }}
							>
								{loading ? 'Signing in...' : 'Sign In'}
							</Button>

							<Typography variant="body2" align="center">
								Don't have an account?{' '}
								<Link to="/signup" style={{ textDecoration: 'none' }}>
									Sign up
								</Link>
							</Typography>
						</Stack>
					</Box>
				</Stack>
			</Paper>
		</Container>
	);
}

export default SignInPage;

