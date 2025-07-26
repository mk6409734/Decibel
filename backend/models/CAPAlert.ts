import mongoose, { Document, Schema, Model } from 'mongoose';
import { isValidPolygonRing, tryFixPolygonRing } from '../utils/cleanAlertData';

export interface ICAPAlert extends Document {
	identifier: string;
	sender: string;
	sent: Date;
	status: string;
	msgType: string;
	scope: string;
	sourceId?: mongoose.Types.ObjectId; // Reference to CAPSource
	sourceName?: string; // Store source name for quick reference
	code?: string[];
	note?: string;
	references?: string;
	incidents?: string;
	convertToGeoJSON(): void;
	info: {
		language: string;
		category: string[];
		event: string;
		responseType: string[];
		urgency: string;
		severity: string;
		certainty: string;
		audience?: string;
		eventCode?: any[];
		effective: Date;
		onset?: Date;
		expires: Date;
		senderName: string;
		headline: string;
		description: string;
		instruction?: string;
		web?: string;
		contact?: string;
		parameter?: any[];
		area: {
			areaDesc: string;
			polygon?: string[];
			circle?: string[];
			geocode?: any[];
			altitude?: number;
			ceiling?: number;
			geoJson?: {
				type: string;
				coordinates: any;
			};
		}[];
	}[];
	fetchedAt: Date;
	isActive: boolean;
}

export interface ICAPAlertModel extends Model<ICAPAlert> {
	findActiveAlerts(): Promise<ICAPAlert[]>;
	findAlertsInArea(coordinates: [number, number]): Promise<ICAPAlert[]>;
}

const CAPAreaSchema = new Schema({
	areaDesc: { type: String, required: true },
	polygon: [String],
	circle: [String],
	geocode: [Schema.Types.Mixed],
	altitude: Number,
	ceiling: Number,
	geoJson: {
		type: {
			type: String,
			enum: ['Polygon', 'MultiPolygon'],
		},
		coordinates: Schema.Types.Mixed,
	},
});

const CAPInfoSchema = new Schema({
	language: { type: String, required: true },
	category: [{ type: String, required: true }],
	event: { type: String, required: true },
	responseType: [String],
	urgency: {
		type: String,
		enum: ['Immediate', 'Expected', 'Future', 'Past', 'Unknown'],
		required: true,
	},
	severity: {
		type: String,
		enum: ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'],
		required: true,
	},
	certainty: {
		type: String,
		enum: ['Observed', 'Likely', 'Possible', 'Unlikely', 'Unknown'],
		required: true,
	},
	audience: String,
	eventCode: [Schema.Types.Mixed],
	effective: { type: Date, required: true },
	onset: Date,
	expires: { type: Date, required: true },
	senderName: { type: String, required: true },
	headline: { type: String, required: true },
	description: { type: String, required: false },
	instruction: String,
	web: String,
	contact: String,
	parameter: [Schema.Types.Mixed],
	area: [CAPAreaSchema],
});

const CAPAlertSchema = new Schema<ICAPAlert>(
	{
		identifier: { type: String, required: true, unique: true, index: true },
		sender: { type: String, required: true },
		sent: { type: Date, required: true, index: true },
		status: {
			type: String,
			enum: ['Actual', 'Exercise', 'System', 'Test', 'Draft'],
			required: true,
		},
		msgType: {
			type: String,
			enum: ['Alert', 'Update', 'Cancel', 'Ack', 'Error'],
			required: true,
		},
		scope: {
			type: String,
			enum: ['Public', 'Restricted', 'Private'],
			required: true,
		},
		sourceId: { type: Schema.Types.ObjectId, ref: 'CAPSource' },
		sourceName: { type: String },
		code: [String],
		note: String,
		references: String,
		incidents: String,
		info: [CAPInfoSchema],
		fetchedAt: { type: Date, default: Date.now, index: true },
		isActive: { type: Boolean, default: true, index: true },
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient querying
CAPAlertSchema.index({ 'info.severity': 1 });
CAPAlertSchema.index({ 'info.expires': 1 });
CAPAlertSchema.index({ 'info.area.geoJson': '2dsphere' });

// Virtual for checking if alert is currently active
CAPAlertSchema.virtual('isCurrentlyActive').get(function () {
	const now = new Date();
	return this.info.some(info => new Date(info.expires) > now);
});

// Method to convert polygon/circle to GeoJSON
CAPAlertSchema.methods.convertToGeoJSON = function () {
	try {
		this.info.forEach(info => {
			if (!info.area || !Array.isArray(info.area)) return;
			
			info.area.forEach(area => {
				if (area.polygon && area.polygon.length > 0) {
					// Convert polygon string to GeoJSON
					const coords: number[][][] = [];
					area.polygon.forEach(polyString => {
						const points = polyString.trim().split(/\s+/);
						const ring: number[][] = [];
						for (let i = 0; i < points.length; i += 2) {
							if (i + 1 < points.length) {
								const lat = parseFloat(points[i]);
								const lon = parseFloat(points[i + 1]);
								if (
									!isNaN(lat) &&
									!isNaN(lon) &&
									isFinite(lat) &&
									isFinite(lon) &&
									lat >= -90 &&
									lat <= 90 &&
									lon >= -180 &&
									lon <= 180
								) {
									ring.push([lon, lat]); // GeoJSON uses [lon, lat]
								}
							}
						}
						// A polygon ring must have at least 3 unique points, and 4 points in total to be closed.
						if (ring.length >= 3) {
							// Close the polygon if not already closed
							if (
								ring[0][0] !== ring[ring.length - 1][0] ||
								ring[0][1] !== ring[ring.length - 1][1]
							) {
								ring.push([ring[0][0], ring[0][1]]);
							}
							coords.push(ring);
						}
					});

					if (coords.length > 0) {
						// Validate each polygon ring for self-intersections
						const validCoords = [];
						for (const ring of coords) {
							if (isValidPolygonRing(ring)) {
								validCoords.push(ring);
							} else {
								console.warn(`Invalid polygon ring detected in alert ${this.identifier}, attempting to fix...`);
								const fixedRing = tryFixPolygonRing(ring);
								if (fixedRing) {
									console.log(`Fixed self-intersecting polygon in alert ${this.identifier}`);
									validCoords.push(fixedRing);
								} else {
									console.error(`Cannot fix self-intersecting polygon in alert ${this.identifier}, skipping ring`);
								}
							}
						}

						if (validCoords.length > 0) {
							area.geoJson = {
								type: validCoords.length === 1 ? 'Polygon' : 'MultiPolygon',
								coordinates: validCoords.length === 1 ? validCoords : validCoords.map(ring => [ring]),
							};
						} else {
							console.error(`All polygon rings invalid for alert ${this.identifier}, skipping GeoJSON creation`);
						}
					}
				}

				if (area.circle && area.circle.length > 0) {
					// For circles, convert to a GeoJSON Polygon
					const circleData = area.circle[0].trim().split(/\s+/);
					if (circleData.length >= 3) {
						const lat = parseFloat(circleData[0]);
						const lon = parseFloat(circleData[1]);
						const radius = parseFloat(circleData[2]) * 1000; // Convert km to meters

						if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius)) {
							const center: [number, number] = [lon, lat];
							const segments = 64; // Number of segments to approximate a circle
							const polygonPoints: number[][] = [];
							const earthRadius = 6378137; // Earth's radius in meters

							for (let i = 0; i <= segments; i++) {
								const bearing = (i * 360) / segments;
								const bearingRad = (bearing * Math.PI) / 180;

								const latRad = (center[1] * Math.PI) / 180;
								const lonRad = (center[0] * Math.PI) / 180;

								const dist = radius / earthRadius;

								const newLatRad = Math.asin(
									Math.sin(latRad) * Math.cos(dist) +
										Math.cos(latRad) * Math.sin(dist) * Math.cos(bearingRad)
								);
								const newLonRad =
									lonRad +
									Math.atan2(
										Math.sin(bearingRad) * Math.sin(dist) * Math.cos(latRad),
										Math.cos(dist) - Math.sin(latRad) * Math.sin(newLatRad)
									);

								const newLat = (newLatRad * 180) / Math.PI;
								const newLon = (newLonRad * 180) / Math.PI;

								if (
									isFinite(newLat) &&
									isFinite(newLon) &&
									newLat >= -90 &&
									newLat <= 90 &&
									newLon >= -180 &&
									newLon <= 180
								) {
									polygonPoints.push([newLon, newLat]);
								}
							}

							if (polygonPoints.length >= 4) {
								// Validate the generated circle polygon
								if (isValidPolygonRing(polygonPoints)) {
									area.geoJson = {
										type: 'Polygon',
										coordinates: [polygonPoints],
									};
								} else {
									console.error(`Generated circle polygon is invalid for alert ${this.identifier}, skipping`);
								}
							}
						}
					}
				}
			});
		});
	} catch (error) {
		console.error(`Error converting to GeoJSON for alert ${this.identifier}:`, error);
		// Don't throw - just log the error and continue
		// This prevents MongoDB error 16755 from breaking the entire operation
	}
};

// Static method to find active alerts
CAPAlertSchema.statics.findActiveAlerts = function () {
	const now = new Date();
	return this.find({
		isActive: true,
		'info.expires': { $gt: now },
	}).sort({ 'info.severity': -1, sent: -1 });
};

// Static method to find alerts by area (using GeoJSON)
CAPAlertSchema.statics.findAlertsInArea = function (coordinates: [number, number]) {
	return this.find({
		isActive: true,
		'info.area.geoJson': {
			$geoIntersects: {
				$geometry: {
					type: 'Point',
					coordinates: coordinates, // [lon, lat]
				},
			},
		},
	});
};

const CAPAlert = mongoose.model<ICAPAlert, ICAPAlertModel>('CAPAlert', CAPAlertSchema);

export default CAPAlert;
