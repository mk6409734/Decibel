import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { CAPAlert, getSeverityColor } from '@/types/cap';
import { convertCAPToLeafletFormat } from '@/services/capApi';
import 'leaflet.markercluster';
import './leaflet-overrides.css';

interface CAPAlertLayerProps {
	alerts: CAPAlert[];
	onAlertClick?: (alert: CAPAlert) => void;
	selectedAlert?: CAPAlert | null;
}

const CAPAlertLayer: React.FC<CAPAlertLayerProps> = ({ alerts, onAlertClick, selectedAlert }) => {
	const map = useMap();
	const layersRef = useRef<{ [alertId: string]: L.Layer[] }>({});

	useEffect(() => {
		// Create cluster group for point-based alerts with enhanced styling
		const clusterGroup = (L as any).markerClusterGroup({
			chunkedLoading: true,
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: true,
			zoomToBoundsOnClick: true,
			maxClusterRadius: 60,
			disableClusteringAtZoom: 15,
			iconCreateFunction: (cluster: any) => {
				const childCount = cluster.getChildCount();
				const markers = cluster.getAllChildMarkers();

				// Determine cluster severity (highest severity wins)
				let maxSeverity = 'Minor';
				let severityCounts = { Extreme: 0, Severe: 0, Moderate: 0, Minor: 0, Unknown: 0 };

				markers.forEach((marker: any) => {
					const severity = marker.feature?.properties?.info?.severity || 'Unknown';
					severityCounts[severity as keyof typeof severityCounts]++;

					if (severity === 'Extreme') maxSeverity = 'Extreme';
					else if (severity === 'Severe' && maxSeverity !== 'Extreme') maxSeverity = 'Severe';
					else if (severity === 'Moderate' && !['Extreme', 'Severe'].includes(maxSeverity))
						maxSeverity = 'Moderate';
				});

				const color = getSeverityColor(
					maxSeverity as 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
				);

				// Enhanced cluster size calculation
				const size = childCount < 5 ? 'small' : childCount < 15 ? 'medium' : 'large';
				const iconSize = size === 'small' ? 35 : size === 'medium' ? 45 : 55;

				// Create severity indicator
				const severityLabel =
					maxSeverity === 'Extreme'
						? '⚠️'
						: maxSeverity === 'Severe'
						? '🔸'
						: maxSeverity === 'Moderate'
						? '🔹'
						: '🔵';

				return new L.DivIcon({
					html: `
            <div style="
              background: linear-gradient(135deg, ${color} 0%, ${color}CC 100%);
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px ${color}33;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'};
              width: ${iconSize}px;
              height: ${iconSize}px;
              position: relative;
              transition: all 0.3s ease;
            ">
              <div style="
                position: absolute;
                top: -5px;
                right: -5px;
                font-size: 12px;
                background: rgba(255,255,255,0.9);
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">${severityLabel}</div>
              <span>${childCount}</span>
            </div>
          `,
					className: `cap-alert-cluster cap-alert-cluster-${size}`,
					iconSize: new L.Point(iconSize, iconSize),
					iconAnchor: [iconSize / 2, iconSize / 2],
				});
			},
		});

		const alertLayers: L.Layer[] = [];
		const polygonLayers: L.Layer[] = [];

		// Clear previous layers
		layersRef.current = {};

		alerts.forEach(alert => {
			const features = convertCAPToLeafletFormat(alert);
			const alertLayersForThis: L.Layer[] = [];

			features.forEach(feature => {
				const isSelected = selectedAlert?._id === alert._id;
				const severityColor = getSeverityColor(feature.properties.info.severity);

				if (feature.type === 'circle') {
					// Create enhanced marker for circle centers
					const marker = L.marker(feature.center, {
						icon: L.divIcon({
							className: `cap-alert-marker ${isSelected ? 'selected' : ''}`,
							html: `<div style="
                width: ${isSelected ? '28px' : '22px'};
                height: ${isSelected ? '28px' : '22px'};
                border-radius: 50%;
                background: linear-gradient(135deg, ${severityColor} 0%, ${severityColor}DD 100%);
                border: ${isSelected ? '4px solid #3B82F6' : '3px solid white'};
                box-shadow: ${
									isSelected
										? '0 0 20px rgba(59, 130, 246, 0.8), 0 4px 12px rgba(0,0,0,0.4)'
										: '0 3px 8px rgba(0,0,0,0.3)'
								};
                position: relative;
                transition: all 0.3s ease;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-size: 10px;
                  font-weight: bold;
                ">⚠</div>
              </div>`,
							iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
							iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
						}),
					});

					// Store feature data for cluster icon creation
					(marker as any).feature = feature;

					// Add popup
					const popupContent = createPopupContent(feature.properties);
					marker.bindPopup(popupContent);

					// Add click handler
					marker.on('click', () => {
						if (onAlertClick) {
							onAlertClick(feature.properties.alert);
						}
					});

					clusterGroup.addLayer(marker);
					alertLayersForThis.push(marker);

					// Enhanced circle area overlay
					const circle = L.circle(feature.center, {
						radius: feature.radius,
						color: severityColor,
						fillColor: severityColor,
						fillOpacity: isSelected ? 0.3 : 0.15,
						weight: isSelected ? 4 : 2,
						opacity: isSelected ? 1.0 : 0.7,
						dashArray: isSelected ? undefined : '5, 5',
						className: isSelected ? 'selected-alert-polygon' : 'cap-alert-polygon',
					});

					// Add click handler to circle
					circle.on('click', () => {
						if (onAlertClick) {
							onAlertClick(feature.properties.alert);
						}
					});

					// Add tooltip to circle
					circle.bindTooltip(feature.properties.info.headline || 'Alert', {
						className: 'custom-state-tooltip',
						direction: 'top',
						offset: [0, -10],
						permanent: false,
						sticky: true,
					});

					polygonLayers.push(circle);
					alertLayersForThis.push(circle);
					circle.addTo(map);
				} else if (feature.type === 'Feature' && feature.geometry) {
					// Enhanced polygon styling
					const polygon = L.geoJSON(feature, {
						style: {
							color: severityColor,
							fillColor: severityColor,
							fillOpacity: isSelected ? 0.35 : 0.2,
							weight: isSelected ? 4 : 2,
							opacity: isSelected ? 1.0 : 0.8,
							dashArray: isSelected ? undefined : '8, 4',
							className: isSelected ? 'selected-alert-polygon' : 'cap-alert-polygon',
						},
					});

					// Add popup
					const popupContent = createPopupContent(feature.properties);
					polygon.bindPopup(popupContent);

					// Add click handler
					polygon.on('click', () => {
						if (onAlertClick) {
							onAlertClick(feature.properties.alert);
						}
					});

					// Add tooltip to polygon
					polygon.bindTooltip(feature.properties.info.headline || 'Alert', {
						className: 'custom-state-tooltip',
						direction: 'top',
						offset: [0, -10],
						permanent: false,
						sticky: true,
					});

					polygonLayers.push(polygon);
					alertLayersForThis.push(polygon);
					polygon.addTo(map);
				}
			});

			// Store layers for this alert
			layersRef.current[alert._id] = alertLayersForThis;
		});

		// Add cluster group to map
		map.addLayer(clusterGroup);

		// Cleanup function
		return () => {
			map.removeLayer(clusterGroup);
			polygonLayers.forEach(layer => {
				map.removeLayer(layer);
			});
		};
	}, [alerts, map, onAlertClick, selectedAlert]);

	// Effect to handle zooming to selected alert
	useEffect(() => {
		if (selectedAlert && layersRef.current[selectedAlert._id]) {
			const alertLayers = layersRef.current[selectedAlert._id];

			// Create a group to get bounds of all layers for this alert
			const group = L.featureGroup(alertLayers);

			try {
				const bounds = group.getBounds();
				if (bounds.isValid()) {
					// Zoom to the alert with some padding
					map.fitBounds(bounds, {
						padding: [30, 30],
						maxZoom: 12,
						animate: true,
						duration: 1.0,
					});
				}
			} catch (error) {
				console.warn('Could not zoom to alert bounds:', error);

				// Fallback: try to get center from first feature
				const features = convertCAPToLeafletFormat(selectedAlert);
				if (features.length > 0) {
					const firstFeature = features[0];
					if (firstFeature.type === 'circle') {
						map.setView(firstFeature.center, 10, { animate: true, duration: 1.0 });
					} else if (firstFeature.geometry?.type === 'Polygon') {
						// Calculate center of polygon
						const coords = firstFeature.geometry.coordinates[0];
						const lats = coords.map((coord: number[]) => coord[1]);
						const lngs = coords.map((coord: number[]) => coord[0]);
						const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
						const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
						map.setView([centerLat, centerLng], 10, { animate: true, duration: 1.0 });
					}
				}
			}
		}
	}, [selectedAlert, map]);

	return null;
};

// Helper function to create popup content with enhanced styling
const createPopupContent = (properties: any): string => {
	const { info, area } = properties;
	const severityColor = getSeverityColor(info.severity);

	return `
    <div class="cap-alert-popup" style="min-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, ${severityColor} 0%, ${severityColor}DD 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
        <h3 style="margin: 0; font-size: 16px; font-weight: bold; line-height: 1.3;">
          ${info.headline}
        </h3>
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="
            background-color: rgba(255,255,255,0.2);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          ">
            ${info.severity}
          </span>
          <span style="font-size: 12px; opacity: 0.9;">
            ${info.urgency}
          </span>
        </div>
      </div>
      
      <div style="padding: 0 4px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500; color: #1F2937;">
          ${info.event}
        </p>
        
        <div style="background: #F3F4F6; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
          <p style="margin: 0; font-size: 12px; color: #374151;">
            <strong>📍 Area:</strong> ${area.areaDesc}
          </p>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6B7280; margin-bottom: 8px;">
          <span><strong>⏰ Expires:</strong> ${new Date(info.expires).toLocaleDateString()}</span>
          <span><strong>📡 Source:</strong> ${info.senderName}</span>
        </div>
      </div>
    </div>
  `;
};

export default CAPAlertLayer;
