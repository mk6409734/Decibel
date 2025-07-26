import React, { createContext, useContext, useState, useEffect } from 'react';
import { District, Siren } from '../types';
import * as api from '../services/api';

interface DataContextType {
	districts: District[];
	sirens: Siren[];
	loading: boolean;
	error: string | null;
	refreshData: () => Promise<void>;
	updateSiren: (sirenId: string, updates: any) => void;
	updateDistrict: (districtId: string, updates: Partial<District>) => void;
	setDistricts: (districts: District[]) => void;
	setSirens: (sirens: Siren[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [districts, setDistricts] = useState<District[]>([]);
	const [sirens, setSirens] = useState<Siren[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refreshData = async () => {
		try {
			setLoading(true);
			const [districtsData, sirensData] = await Promise.all([api.getDistricts(), api.getSirens()]);
			setDistricts(districtsData);
			setSirens(sirensData);
			setError(null);
		} catch (err) {
			setError('Failed to fetch data');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const updateSiren = (sirenId: string, updates: Partial<Siren>) => {
		setDistricts(prevDistricts =>
			prevDistricts.map(district => ({
				...district,
				blocks: district.blocks.map(block => ({
					...block,
					sirens: block.sirens.map(siren =>
						siren.id === sirenId ? { ...siren, ...updates } : siren
					),
				})),
			}))
		);

		// Also update the flat sirens array
		setSirens(prevSirens =>
			prevSirens.map(siren => (siren.id === sirenId ? { ...siren, ...updates } : siren))
		);
	};

	const updateDistrict = (districtId: string, updates: Partial<District>) => {
		setDistricts(prevDistricts =>
			prevDistricts.map(district =>
				district.id === districtId ? { ...district, ...updates } : district
			)
		);
	};

	useEffect(() => {
		refreshData();
	}, []);

	return (
		<DataContext.Provider
			value={{
				districts,
				sirens,
				loading,
				error,
				refreshData,
				updateSiren,
				updateDistrict,
				setDistricts,
				setSirens,
			}}
		>
			{children}
		</DataContext.Provider>
	);
};

export const useData = () => {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error('useData must be used within a DataProvider');
	}
	return context;
};
