import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { DefaultZoomButton } from './MapElements';
import { GeoJSONLayer } from './GeoJSONLayer';
import stateData from './states.json';
import CAPAlertLayer from './CAPAlertLayer';
import { CAPAlert } from '@/types/cap';
import { useEffect } from 'react';

interface CAPMapViewProps {
	capAlerts: CAPAlert[];
	onAlertClick?: (alert: CAPAlert) => void;
	selectedAlert?: CAPAlert | null;
}

const CAPMapView: React.FC<CAPMapViewProps> = ({
	capAlerts,
	onAlertClick,
	selectedAlert = null,
}) => {
	useEffect(() => {
		// Fix Leaflet icon issues in production build
		import('leaflet').then(L => {
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: '/marker-icon-2x.png',
				iconUrl: '/marker-icon.png',
				shadowUrl: '/marker-shadow.png',
			});
		});
	}, []);

	return (
		<div className='h-full'>
			<Card className='h-full bg-gray-800 border-gray-700 shadow-lg'>
				<CardHeader className='pb-2 flex flex-row justify-between items-center border-b border-gray-700'>
					<CardTitle className='text-lg font-medium text-white'>Disaster Alert Map</CardTitle>
					<div className='flex gap-2'>
						{/* <Button
							variant='outline'
							className='text-xs h-8 border-gray-600 hover:bg-gray-700 text-gray-300'
						>
							<Map className='h-3.5 w-3.5 mr-1' />
							Satellite
						</Button> */}
						<Button
							variant='outline'
							className='text-xs h-8 border-gray-600 hover:bg-gray-700 text-gray-300'
						>
							<MapPin className='h-3.5 w-3.5 mr-1' />
							Center Map
						</Button>
					</div>
				</CardHeader>
				<CardContent className='h-[calc(100%-80px)] relative p-0'>
					<MapContainer
						style={{ height: '100%', width: '100%', borderRadius: '0 0 8px 8px' }}
						center={[20.2961, 85.8245]}
						zoom={6}
						minZoom={4}
						attributionControl={false}
						maxZoom={18}
						scrollWheelZoom={true}
						maxBounds={new LatLngBounds([6.75, 68.1], [35.5, 97.4])}
						maxBoundsViscosity={1.0}
					>
						<TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

						{/* Base State Layer - Always Visible */}
						<GeoJSONLayer geoData={stateData} dataParams={[{ param: 'ST_NM', title: 'State' }]} />

						{/* CAP Alerts Layer - Always Visible */}
						<CAPAlertLayer
							alerts={capAlerts}
							onAlertClick={onAlertClick}
							selectedAlert={selectedAlert}
						/>

						<DefaultZoomButton position='topleft' />
					</MapContainer>
				</CardContent>
			</Card>
		</div>
	);
};

export default CAPMapView;
