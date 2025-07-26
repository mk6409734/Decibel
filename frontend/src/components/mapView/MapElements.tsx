import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

interface DefaultZoomButtonProps {
	position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

export const DefaultZoomButton: React.FC<DefaultZoomButtonProps> = ({ position }) => {
	const map = useMap();

	useEffect(() => {
		const zoomToIndia = () => {
			map.setView([20.2961, 85.8245], 8);
		};

		// Create a custom control
		const ZoomControl = L.Control.extend({
			options: {
				position: position,
			},
			onAdd: function () {
				const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
				const button = L.DomUtil.create('a', '', container);
				button.innerHTML = '🏠';
				button.title = 'Zoom to Default View';
				button.style.fontWeight = 'bold';
				button.style.fontSize = '18px';
				button.style.lineHeight = '24px';
				button.style.textAlign = 'center';
				button.style.cursor = 'pointer';
				button.style.color = '#333';
				button.href = '#';

				L.DomEvent.on(button, 'click', function (e) {
					L.DomEvent.stopPropagation(e);
					L.DomEvent.preventDefault(e);
					zoomToIndia();
				});

				return container;
			},
		});

		// Add the control to the map
		const zoomControl = new ZoomControl();
		map.addControl(zoomControl);

		return () => {
			map.removeControl(zoomControl);
		};
	}, [map, position]);

	return null;
};

export const GeoJSONLayer = ({
	geoData,
	dataParams,
}: {
	geoData: any;
	dataParams: { param: string; title: string }[];
}) => {
	const map = useMap();

	useEffect(() => {
		if (!geoData) return;

		const layer = L.geoJSON(geoData, {
			style: () => ({
				fillColor: '#3388ff',
				weight: 1,
				opacity: 1,
				color: '#3388ff',
				fillOpacity: 0.1,
			}),
			onEachFeature: (feature, layer) => {
				if (feature.properties) {
					const popupContent = dataParams
						.map(param => {
							return `<b>${param.title}:</b> ${feature.properties[param.param]}`;
						})
						.join('<br/>');

					layer.bindPopup(popupContent);
				}
			},
		}).addTo(map);

		return () => {
			map.removeLayer(layer);
		};
	}, [geoData, map, dataParams]);

	return null;
};

interface DrawControlProps {
	onPolygonDrawn?: (polygon: GeoJSON.Polygon) => void;
}

export const DrawControl: React.FC<DrawControlProps> = ({ onPolygonDrawn }) => {
	const handleCreated = (e: any) => {
		const { layerType, layer } = e;

		if (layerType === 'polygon' && onPolygonDrawn) {
			const geoJSON = layer.toGeoJSON();
			onPolygonDrawn(geoJSON.geometry as GeoJSON.Polygon);
		}
	};

	return (
		<FeatureGroup>
			<EditControl
				position='topright'
				draw={{
					rectangle: false,
					circle: false,
					circlemarker: false,
					marker: false,
					polyline: false,
				}}
				edit={{
					edit: false,
					remove: true,
				}}
				onCreated={handleCreated}
			/>
		</FeatureGroup>
	);
};
