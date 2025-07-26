import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils';
export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	emailVerified: boolean;
}

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	avatar?: string;
}

// Set auth token in axios headers
export const setAuthToken = (token: string | null) => {
	if (token) {
		axios.defaults.headers.common['x-auth-token'] = token;
	} else {
		delete axios.defaults.headers.common['x-auth-token'];
	}
};

// Initialize auth token from localStorage
export const initAuth = () => {
	const token = localStorage.getItem('token');
	if (token) {
		setAuthToken(token);
	}
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
	const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
	const { token } = response.data;

	// Store token in localStorage and set axios headers
	localStorage.setItem('token', token);
	setAuthToken(token);

	return response.data;
};

export const loadUser = async (): Promise<User> => {
	const response = await axios.get(`${API_BASE_URL}/api/auth/`);
	return response.data;
};

export const logout = () => {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	setAuthToken(null);
};
