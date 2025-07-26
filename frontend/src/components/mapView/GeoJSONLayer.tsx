import { GeoJSON } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import { Feature } from 'geojson';

interface DataParamI {
	param: string;
	title: string;
}

export const GeoJSONLayer: React.FC<{
	geoData: any;
	dataParams: DataParamI[];
}> = ({ geoData, dataParams }) => {
	const map = useMap();

	const defaultStyle = {
		fillColor: '#374151', // gray-700 - matches dark theme
		fillOpacity: 0.1,
		color: '#6B7280', // gray-500 - subtle border
		weight: 1,
		opacity: 0.6,
	};

	const hoverStyle = {
		fillColor: '#4B5563', // gray-600 - slightly lighter on hover
		fillOpacity: 0.2,
		color: '#9CA3AF', // gray-400 - more visible border on hover
		weight: 2,
		opacity: 0.8,
	};

	const clickStyle = {
		fillColor: '#1F2937', // gray-800 - darker when clicked
		fillOpacity: 0.3,
		color: '#D1D5DB', // gray-300 - light border when active
		weight: 2,
		opacity: 1.0,
	};

	return (
		<GeoJSON
			style={defaultStyle}
			onEachFeature={(feature: Feature, layer) => {
				layer.on('click', eve => {
					if (map) {
						// Apply click style
						eve.target.setStyle(clickStyle);

						// Zoom to the clicked feature
						map.fitBounds(eve.target.getBounds(), {
							animate: true,
							duration: 0.75,
							padding: [20, 20],
							maxZoom: 10,
						});

						// Reset style after animation
						setTimeout(() => {
							eve.target.setStyle(defaultStyle);
						}, 1000);
					}
				});

				layer.on('mouseover', eve => {
					eve.target.setStyle(hoverStyle);
				});

				layer.on('mouseout', eve => {
					eve.target.setStyle(defaultStyle);
				});

				// Create tooltip content
				const tooltipContent = () =>
					dataParams
						.map(
							({ title, param }) =>
								`<strong style="color: #374151;">${title}:</strong> <span style="color: #6B7280;">${
									feature.properties?.[param] || 'N/A'
								}</span>`
						)
						.join('<br/>');

				layer.bindTooltip(tooltipContent(), {
					className: 'custom-state-tooltip',
					direction: 'top',
					offset: [0, -10],
					permanent: false,
					sticky: true,
				});
			}}
			data={geoData}
		/>
	);
};
