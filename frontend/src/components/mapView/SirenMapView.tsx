import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Siren } from '@/types';
import SirenStatusBadge from '../sirenList/SirenStatusBadge';
import { Button } from '@/components/ui/button';
import { LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import SirenMarker from './SirenMarker';
import BaseMapView from './BaseMapView';
import SirenControlDialog from '../SirenControlDialog';
import MapController from './MapController';
import './marker-animations.css';

interface SirenMapViewProps {
	sirens: Siren[];
	selectedSiren?: Siren | null;
	onSirenSelect?: (siren: Siren | null) => void;
}

const SirenMapView: React.FC<SirenMapViewProps> = ({ sirens, selectedSiren: externalSelectedSiren, onSirenSelect }) => {
	const [internalSelectedSiren, setInternalSelectedSiren] = useState<Siren | null>(null);
	const [controlDialogOpen, setControlDialogOpen] = useState(false);
	const [activeSiren, setActiveSiren] = useState<any>(null);

	// Use external selected siren if provided, otherwise use internal state
	const selectedSiren = externalSelectedSiren !== undefined ? externalSelectedSiren : internalSelectedSiren;
	const setSelectedSiren = onSirenSelect || setInternalSelectedSiren;

	const mapSirens = useMemo(() => {
		return sirens.map(siren => {
			const status = siren.status;
			let color = '#666666';

			if (status === 'active') color = '#10B981';
			if (status === 'warning') color = '#F59E0B';
			if (status === 'alert') color = '#EF4444';

			// Use consistent fallback coordinates if missing
			const fallbackLat = siren.latitude || 20.2961; // Center of India
			const fallbackLng = siren.longitude || 85.8245; // Center of India

			return {
				...siren,
				color,
				playing: (siren as any).playing || false,
				latitude: fallbackLat,
				longitude: fallbackLng,
			};
		});
	}, [sirens]);

	const handleTestSiren = (siren: any, e: React.MouseEvent) => {
		e.stopPropagation();
		setActiveSiren(siren);
		setControlDialogOpen(true);
	};

	const handleMarkerClick = (siren: any) => {
		console.log('SirenMapView: Marker clicked:', siren);
		setSelectedSiren(siren);
	};


	return (
		<div className='h-full relative'>
			<BaseMapView title='Emergency Sirens Map'>
				<MapController selectedSiren={selectedSiren} sirens={mapSirens} />
				<LayersControl position='topright'>
					{sirens.length > 0 && (
						<LayersControl.Overlay checked name='Emergency Sirens'>
							<MarkerClusterGroup chunkedLoading>
								{mapSirens.map((siren, index) => (
									<SirenMarker
										key={siren.id}
										index={index}
										siren={siren as any}
										color={siren.color || '#666666'}
										playing={siren.playing || false}
										isSelected={selectedSiren?.id === siren.id}
										onClick={() => handleMarkerClick(siren)}
									/>
								))}
							</MarkerClusterGroup>
						</LayersControl.Overlay>
					)}
				</LayersControl>
			</BaseMapView>

			{/* Siren popup when selected */}
			{selectedSiren && (
				<div className='absolute right-4 bottom-4 w-64 z-[1000]'>
					<Card className='bg-gray-800 border-gray-700 shadow-lg'>
						<CardHeader className='pb-1 pt-2 flex flex-row justify-between items-center'>
							<CardTitle className='text-sm font-medium text-white'>
								{selectedSiren.name}
							</CardTitle>
							<Button
								variant='ghost'
								size='icon'
								className='h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700'
								onClick={() => setSelectedSiren(null)}
							>
								✕
							</Button>
						</CardHeader>
						<CardContent className='pt-2 pb-3 space-y-1'>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-400'>Status:</span>
								<SirenStatusBadge status={selectedSiren.status} />
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-400'>Type:</span>
								<span className='text-white'>{selectedSiren.type.join(', ')}</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-400'>Location:</span>
								<span className='text-white'>{selectedSiren.location}</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-gray-400'>Last Checked:</span>
								<span className='text-white'>
									{new Date(selectedSiren.lastChecked).toLocaleTimeString()}
								</span>
							</div>
							<div className='pt-2 grid grid-cols-2 gap-2'>
								<Button
									variant='outline'
									size='sm'
									className='text-xs h-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
									onClick={e => handleTestSiren(selectedSiren, e)}
								>
									Test Siren
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='text-xs h-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
								>
									View Details
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Add SirenControlDialog */}
			{activeSiren && (
				<SirenControlDialog
					isOpen={controlDialogOpen}
					onOpenChange={setControlDialogOpen}
					siren={activeSiren}
				/>
			)}
		</div>
	);
};

export default SirenMapView;