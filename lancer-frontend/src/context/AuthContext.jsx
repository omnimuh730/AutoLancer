import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useApi from '../api/useApi';

const AuthContext = createContext({ 
	user: null, 
	isAuthenticated: false, 
	signin: async () => {}, 
	signup: async () => {}, 
	signout: () => {} 
});

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const { post } = useApi(import.meta.env.VITE_API_URL);

	// Load user from localStorage on mount
	useEffect(() => {
		const storedUser = localStorage.getItem('auth_user');
		if (storedUser) {
			try {
				setUser(JSON.parse(storedUser));
			} catch (e) {
				console.error('Failed to parse stored user', e);
				localStorage.removeItem('auth_user');
			}
		}
	}, []);

	const signin = async (name, password) => {
		try {
			const res = await post('/auth/signin', { name, password });
			if (res && res.success) {
				setUser(res.user);
				localStorage.setItem('auth_user', JSON.stringify(res.user));
				return { success: true, user: res.user };
			}
			return { success: false, message: res.message || 'Sign in failed' };
		} catch (error) {
			const message = error?.data?.message || error?.message || 'Sign in failed';
			return { success: false, message };
		}
	};

	const signup = async (name, password) => {
		try {
			const res = await post('/auth/signup', { name, password });
			if (res && res.success) {
				setUser(res.user);
				localStorage.setItem('auth_user', JSON.stringify(res.user));
				return { success: true, user: res.user };
			}
			return { success: false, message: res.message || 'Sign up failed' };
		} catch (error) {
			const message = error?.data?.message || error?.message || 'Sign up failed';
			return { success: false, message };
		}
	};

	const signout = () => {
		setUser(null);
		localStorage.removeItem('auth_user');
	};

	const value = useMemo(() => ({
		user,
		isAuthenticated: !!user,
		signin,
		signup,
		signout
	}), [user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

