import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const API_BASE_URL = 'https://cap.decibel.company';
// export const API_BASE_URL = 'http://localhost:5001';
