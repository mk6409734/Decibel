import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	login as loginService,
	loadUser,
	logout as logoutService,
	User,
	LoginCredentials,
} from '../services/auth';

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: User | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [user, setUser] = useState<User | null>(null);
	const navigate = useNavigate();

	// Check if user is authenticated on mount
	useEffect(() => {
		const checkAuth = async () => {
			if (localStorage.getItem('token')) {
				try {
					const userData = await loadUser();
					setUser(userData);
					setIsAuthenticated(true);
				} catch (error) {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					setIsAuthenticated(false);
					setUser(null);
				}
			}
			setIsLoading(false);
		};

		checkAuth();
	}, []);

	const login = async (credentials: LoginCredentials) => {
		setIsLoading(true);
		try {
			await loginService(credentials);
			const userData = await loadUser();
			localStorage.setItem('user', JSON.stringify(userData));
			setUser(userData);
			setIsAuthenticated(true);
			navigate('/');
		} catch (error) {
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		logoutService();
		setIsAuthenticated(false);
		setUser(null);
		navigate('/login');
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
