import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Siren } from '@/types';

interface MapControllerProps {
	selectedSiren: Siren | null;
	sirens: any[];
}

const MapController: React.FC<MapControllerProps> = ({ selectedSiren, sirens }) => {
	const map = useMap();

	useEffect(() => {
		if (selectedSiren && map) {
			console.log('MapController: Selected siren:', selectedSiren);
			console.log('MapController: Available sirens:', sirens.length);
			
			// Find the siren with coordinates
			const sirenWithCoords = sirens.find(s => s.id === selectedSiren.id);
			console.log('MapController: Found siren with coords:', sirenWithCoords);
			
			if (sirenWithCoords && sirenWithCoords.latitude && sirenWithCoords.longitude) {
				const lat = parseFloat(sirenWithCoords.latitude.toString());
				const lng = parseFloat(sirenWithCoords.longitude.toString());
				console.log('MapController: Flying to coordinates:', [lat, lng]);
				
				// Fly to the selected siren with animation
				map.flyTo(
					[lat, lng], 
					15, // Zoom level
					{
						duration: 1.5, // Animation duration in seconds
						easeLinearity: 0.25
					}
				);
			} else {
				console.log('MapController: No coordinates found for siren:', selectedSiren);
			}
		}
	}, [selectedSiren, map, sirens]);

	return null;
};

export default MapController;