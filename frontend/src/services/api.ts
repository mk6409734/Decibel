import axios from 'axios';
import { District, Siren } from '../types';
import { API_BASE_URL } from '@/lib/utils';

// District APIs
export const getDistricts = async (): Promise<District[]> => {
	const response = await axios.get(`${API_BASE_URL}/api/districts/dashboard/data`);
	return response.data;
};

export const getDistrict = async (id: string): Promise<District> => {
	const response = await axios.get(`${API_BASE_URL}/api/districts/${id}`);
	return response.data;
};

export const createDistrict = async (district: Omit<District, 'id'>): Promise<District> => {
	const response = await axios.post(`${API_BASE_URL}/api/districts/create`, district);
	return response.data;
};

export const updateDistrict = async (
	id: string,
	district: Partial<District>
): Promise<District> => {
	const response = await axios.patch(`${API_BASE_URL}/api/districts/${id}`, district);
	return response.data;
};

export const deleteDistrict = async (id: string): Promise<void> => {
	await axios.delete(`${API_BASE_URL}/api/districts/${id}`);
};

// Siren APIs
export const getSirens = async (): Promise<Siren[]> => {
	const response = await axios.get(`${API_BASE_URL}/api/sirens/all`);
	return response.data;
};

export const getSiren = async (id: string): Promise<Siren> => {
	const response = await axios.get(`${API_BASE_URL}/api/sirens/${id}`);
	return response.data;
};

export const createSiren = async (siren: Omit<Siren, 'id'>): Promise<Siren> => {
	const response = await axios.post(`${API_BASE_URL}/api/sirens/create`, siren);
	return response.data;
};

export const updateSiren = async (id: string, siren: Partial<Siren>): Promise<Siren> => {
	const response = await axios.patch(`${API_BASE_URL}/api/sirens/${id}`, siren);
	return response.data;
};

export const deleteSiren = async (id: string): Promise<void> => {
	await axios.delete(`${API_BASE_URL}/api/sirens/${id}`);
};
