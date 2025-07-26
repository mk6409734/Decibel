import axios from 'axios';
import { CAPAlert, CAPAlertResponse, CAPAlertStats } from '@/types/cap';

const API_BASE_URL = 'https://response.decibel.company';

const capApi = axios.create({
	baseURL: `${API_BASE_URL}/api/cap-alerts`,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Add auth token if available
capApi.interceptors.request.use(
	config => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	error => Promise.reject(error)
);

export const capAlertService = {
	/**
	 * Fetch latest alerts from NDMA
	 */
	async fetchAlerts(): Promise<CAPAlertResponse> {
		try {
			const response = await capApi.get<CAPAlertResponse>('/fetch');
			return response.data;
		} catch (error) {
			console.error('Error fetching CAP alerts:', error);
			throw error;
		}
	},

	/**
	 * Get all active alerts
	 */
	async getActiveAlerts(): Promise<CAPAlert[]> {
		try {
			const response = await capApi.get<CAPAlertResponse>('/active');
			return response.data.alerts || [];
		} catch (error) {
			console.error('Error getting active alerts:', error);
			throw error;
		}
	},

	/**
	 * Get specific alert by ID
	 */
	async getAlert(id: string): Promise<CAPAlert | null> {
		try {
			const response = await capApi.get<CAPAlertResponse>(`/${id}`);
			return response.data.alert || null;
		} catch (error) {
			console.error('Error getting alert:', error);
			throw error;
		}
	},

	/**
	 * Get alerts for a specific location
	 */
	async getAlertsByLocation(lat: number, lng: number): Promise<CAPAlert[]> {
		try {
			const response = await capApi.get<CAPAlertResponse>(`/area/${lat}/${lng}`);
			return response.data.alerts || [];
		} catch (error) {
			console.error('Error getting alerts by location:', error);
			throw error;
		}
	},

	/**
	 * Get alerts by severity level
	 */
	async getAlertsBySeverity(severity: string): Promise<CAPAlert[]> {
		try {
			const response = await capApi.get<CAPAlertResponse>(`/severity/${severity}`);
			return response.data.alerts || [];
		} catch (error) {
			console.error('Error getting alerts by severity:', error);
			throw error;
		}
	},

	/**
	 * Refresh alerts from NDMA
	 */
	async refreshAlerts(): Promise<CAPAlertResponse> {
		try {
			const response = await capApi.post<CAPAlertResponse>('/refresh');
			return response.data;
		} catch (error) {
			console.error('Error refreshing alerts:', error);
			throw error;
		}
	},

	/**
	 * Get alert statistics
	 */
	async getAlertStats(): Promise<CAPAlertStats> {
		try {
			const response = await capApi.get<CAPAlertResponse>('/stats');
			return response.data.stats || { total: 0, active: 0, severity: [], category: [] };
		} catch (error) {
			console.error('Error getting alert stats:', error);
			throw error;
		}
	},
};

// WebSocket event handlers for real-time updates
export const setupCAPWebSocketHandlers = (socket: any) => {
	socket.on('cap-alert-new', (alert: CAPAlert) => {
		console.log('New CAP alert received:', alert);
		// You can dispatch events or update state here
		window.dispatchEvent(new CustomEvent('cap-alert-new', { detail: alert }));
	});

	socket.on('cap-alert-update', (alert: CAPAlert) => {
		console.log('CAP alert updated:', alert);
		// You can dispatch events or update state here
		window.dispatchEvent(new CustomEvent('cap-alert-update', { detail: alert }));
	});
};

// Helper function to convert CAP alert data to Leaflet format
export const convertCAPToLeafletFormat = (alert: CAPAlert) => {
	const features: any[] = [];

	alert.info.forEach(info => {
		info.area.forEach(area => {
			// Handle polygon coordinate strings from area.polygon
			if (area.polygon && area.polygon.length > 0) {
				area.polygon.forEach(polygonString => {
					try {
						// Parse the polygon string: "lat1,lng1 lat2,lng2 lat3,lng3 ..."
						const coordinates = polygonString.trim().split(' ').map(coord => {
							const [lat, lng] = coord.split(',').map(Number);
							// GeoJSON uses [lng, lat] format
							return [lng, lat];
						});

						// Ensure polygon is closed (first and last coordinates should match)
						if (coordinates.length > 0) {
							const firstCoord = coordinates[0];
							const lastCoord = coordinates[coordinates.length - 1];
							if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
								coordinates.push([firstCoord[0], firstCoord[1]]);
							}

							// Create GeoJSON polygon feature
							features.push({
								type: 'Feature',
								geometry: {
									type: 'Polygon',
									coordinates: [coordinates],
								},
								properties: {
									alert,
									info,
									area,
								},
							});
						}
					} catch (error) {
						console.warn('Error parsing polygon coordinates:', polygonString, error);
					}
				});
			}

			// Handle circle coordinate strings from area.circle
			if (area.circle && area.circle.length > 0) {
				area.circle.forEach(circleString => {
					try {
						// Parse circle string: "lat,lng radius"
						const [coordStr, radiusStr] = circleString.trim().split(' ');
						const [lat, lng] = coordStr.split(',').map(Number);
						const radius = parseFloat(radiusStr);

						features.push({
							type: 'circle',
							center: [lat, lng],
							radius: radius,
							properties: {
								alert,
								info,
								area,
							},
						});
					} catch (error) {
						console.warn('Error parsing circle coordinates:', circleString, error);
					}
				});
			}

			// Handle existing geoJson format (backward compatibility)
			if (area.geoJson) {
				if (area.geoJson.type === 'Circle') {
					// Handle circle separately as Leaflet doesn't support GeoJSON circles
					features.push({
						type: 'circle',
						center: [area.geoJson.coordinates[1], area.geoJson.coordinates[0]],
						radius: area.geoJson.coordinates[2],
						properties: {
							alert,
							info,
							area,
						},
					});
				} else {
					// Regular GeoJSON polygon
					features.push({
						type: 'Feature',
						geometry: area.geoJson,
						properties: {
							alert,
							info,
							area,
						},
					});
				}
			}
		});
	});

	return features;
};
