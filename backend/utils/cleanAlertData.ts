/**
 * Utility function to clean alert data by removing any geoJson fields
 * This prevents MongoDB error 16755 when updating documents with 2dsphere indexes
 */
export function cleanAlertData(alert: any): any {
	if (!alert) return alert;

	// Deep clone to avoid modifying the original
	const cleaned = { ...alert };

	// Remove geoJson from info.area arrays
	if (cleaned.info && Array.isArray(cleaned.info)) {
		cleaned.info = cleaned.info.map((infoItem: any) => {
			if (!infoItem) return infoItem;

			const { area, ...infoWithoutArea } = infoItem;
			
			if (area && Array.isArray(area)) {
				const cleanedArea = area.map((areaItem: any) => {
					if (!areaItem) return areaItem;
					
					// Remove geoJson field to prevent MongoDB geospatial index errors
					const { geoJson, ...areaWithoutGeoJson } = areaItem;
					return areaWithoutGeoJson;
				});
				
				return { ...infoWithoutArea, area: cleanedArea };
			}
			
			return infoItem;
		});
	}

	return cleaned;
}

/**
 * Validates if coordinates are within valid ranges
 * @param lat Latitude (-90 to 90)
 * @param lon Longitude (-180 to 180)
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
	return (
		!isNaN(lat) &&
		!isNaN(lon) &&
		isFinite(lat) &&
		isFinite(lon) &&
		lat >= -90 &&
		lat <= 90 &&
		lon >= -180 &&
		lon <= 180
	);
}

/**
 * Check if two line segments intersect
 * Line segment 1: from (x1, y1) to (x2, y2)
 * Line segment 2: from (x3, y3) to (x4, y4)
 */
function doSegmentsIntersect(
	x1: number, y1: number, x2: number, y2: number,
	x3: number, y3: number, x4: number, y4: number
): boolean {
	// Calculate the direction of the four points
	const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number => {
		return (cy - ay) * (bx - ax) - (by - ay) * (cx - ax);
	};

	const d1 = ccw(x1, y1, x2, y2, x3, y3);
	const d2 = ccw(x1, y1, x2, y2, x4, y4);
	const d3 = ccw(x3, y3, x4, y4, x1, y1);
	const d4 = ccw(x3, y3, x4, y4, x2, y2);

	// Check if segments intersect
	if (d1 * d2 < 0 && d3 * d4 < 0) {
		return true;
	}

	// Check for collinear points
	if (d1 === 0 && isPointOnSegment(x1, y1, x2, y2, x3, y3)) return true;
	if (d2 === 0 && isPointOnSegment(x1, y1, x2, y2, x4, y4)) return true;
	if (d3 === 0 && isPointOnSegment(x3, y3, x4, y4, x1, y1)) return true;
	if (d4 === 0 && isPointOnSegment(x3, y3, x4, y4, x2, y2)) return true;

	return false;
}

/**
 * Check if point (px, py) lies on segment from (x1, y1) to (x2, y2)
 */
function isPointOnSegment(x1: number, y1: number, x2: number, y2: number, px: number, py: number): boolean {
	return (
		Math.min(x1, x2) <= px && px <= Math.max(x1, x2) &&
		Math.min(y1, y2) <= py && py <= Math.max(y1, y2)
	);
}

/**
 * Validates if a polygon ring is valid (no self-intersections)
 * @param ring Array of [lon, lat] coordinates
 * @returns true if valid, false if self-intersecting
 */
export function isValidPolygonRing(ring: number[][]): boolean {
	if (!ring || ring.length < 4) {
		return false; // A valid ring needs at least 4 points (including closing point)
	}

	// Check each edge against all non-adjacent edges
	const n = ring.length - 1; // Exclude the last point as it should be same as first
	
	for (let i = 0; i < n; i++) {
		const x1 = ring[i][0];
		const y1 = ring[i][1];
		const x2 = ring[(i + 1) % n][0];
		const y2 = ring[(i + 1) % n][1];

		// Check against all non-adjacent edges
		for (let j = i + 2; j < n; j++) {
			// Skip if this would be checking adjacent edges
			if (i === 0 && j === n - 1) continue;

			const x3 = ring[j][0];
			const y3 = ring[j][1];
			const x4 = ring[(j + 1) % n][0];
			const y4 = ring[(j + 1) % n][1];

			if (doSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
				console.warn(
					`Polygon self-intersection detected: edges ${i}-${i + 1} and ${j}-${j + 1} intersect`
				);
				return false;
			}
		}
	}

	return true;
}

/**
 * Attempts to fix a self-intersecting polygon by reversing the winding order
 * @param ring Array of [lon, lat] coordinates
 * @returns Fixed ring or null if cannot be fixed
 */
export function tryFixPolygonRing(ring: number[][]): number[][] | null {
	if (!ring || ring.length < 4) {
		return null;
	}

	// First, try reversing the winding order
	const reversed = [...ring].reverse();
	if (isValidPolygonRing(reversed)) {
		return reversed;
	}

	// If reversing doesn't work, the polygon is too complex to fix automatically
	return null;
}