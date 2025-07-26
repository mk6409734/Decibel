import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Siren } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SirenControlDialog from '@/components/SirenControlDialog';
import { Clock, MapPin, Wifi, AlertCircle } from 'lucide-react';

// Define marker icon function to create colored markers
const createColoredIcon = (color: string, isPlaying: boolean, isOnline: boolean, isSelected: boolean) => {
	const statusColor = isOnline === false ? '#ff0000' : isPlaying ? '#FFBF00' : color;

	return L.divIcon({
		className: `custom-icon ${isSelected ? 'selected-marker' : ''}`,
		html: `<div class="marker-inner" style="
      background-color: ${statusColor};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    ">
		${isSelected ? '<div class="pulse-ring"></div>' : ''}
	</div>`,
		iconSize: [28, 28],
		iconAnchor: [14, 14],
		popupAnchor: [0, -14],
	});
};

interface SirenMarkerProps {
	siren: Siren;
	index: number;
	color: string;
	playing?: boolean;
	isOnline?: boolean;
	isSelected?: boolean;
	onClick?: () => void;
	sendSignal?: (
		sirenId: string,
		type: string,
		value: any,
		alarmType: string,
		gapAudio: number,
		language: string
	) => void;
}

const SirenMarker: React.FC<SirenMarkerProps> = ({
	siren,
	index,
	color,
	playing = false,
	isOnline = true,
	isSelected = false,
	onClick,
	sendSignal,
}) => {
	// State for dialog
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Determine position from siren data
	const position = siren.latitude && siren.longitude ? [siren.latitude, siren.longitude] : [0, 0]; // Default fallback position

	// Create icon based on status color
	const icon = createColoredIcon(color || '#3388ff', playing, isOnline, isSelected);

	return (
		<>
			<Marker 
				position={position as [number, number]} 
				icon={icon} 
				key={`siren-marker-${index}`}
				eventHandlers={{
					click: () => {
						if (onClick) onClick();
					}
				}}
			>
				<Popup>
					<div className='p-4 w-72 bg-white rounded-lg shadow-lg'>
						<div className='flex items-center justify-between mb-3'>
							<h3 className='font-bold text-lg text-gray-800'>{siren.name}</h3>
							<Badge
								variant={siren.status === 'active' ? 'default' : 'destructive'}
								className='ml-2'
							>
								{siren.status}
							</Badge>
						</div>

						<div className='space-y-3 text-sm text-gray-600'>
							<div className='flex items-center'>
								<MapPin className='w-4 h-4 mr-2 text-gray-500' />
								<span>ID: {siren.id}</span>
							</div>

							<div className='flex items-center'>
								<AlertCircle
									className={`w-4 h-4 mr-2 ${playing ? 'text-yellow-500' : 'text-gray-400'}`}
								/>
								<span>{playing ? 'Alarm Active' : 'Standby'}</span>
							</div>

							<div className='flex items-center'>
								<Clock className='w-4 h-4 mr-2 text-gray-500' />
								<span>Last Updated: {new Date().toLocaleString()}</span>
							</div>
						</div>

						<div className='mt-4 pt-3 border-t border-gray-200'>
							<Button
								size='sm'
								onClick={() => setIsDialogOpen(true)}
								className='w-full bg-blue-600 hover:bg-blue-700'
							>
								Control Panel
							</Button>
						</div>
					</div>
				</Popup>
			</Marker>

			<SirenControlDialog siren={siren} isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</>
	);
};

export default SirenMarker;
