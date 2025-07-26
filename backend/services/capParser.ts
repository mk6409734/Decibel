import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { XMLParser } from 'fast-xml-parser';

interface CAPAlert {
	identifier: string;
	sender: string;
	sent: Date;
	status: string;
	msgType: string;
	scope: string;
	sourceId?: string; // Track which source this alert came from
	sourceName?: string;
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
		}[];
	}[];
	code?: string[];
	note?: string;
	references?: string;
	incidents?: string;
}

interface CAPSource {
	_id: string;
	name: string;
	url: string;
	country: string;
}

class CAPParserService {
	private xmlParser: XMLParser;
	private axiosInstance: AxiosInstance;
	private responseCache: Map<string, { data: any; timestamp: number }> = new Map();
	private stats = {
		totalRequests: 0,
		successfulRequests: 0,
		failedRequests: 0,
		cacheHits: 0,
		htmlFallbacks: 0,
		lastError: null as any,
	};
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
	private readonly NDMA_RSS_URL = 'https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml';
	private readonly NDMA_CAP_URL =
		'https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=';

	constructor() {
		this.xmlParser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
			textNodeName: '#text',
			parseTagValue: true,
			parseAttributeValue: true,
			trimValues: true,
			// Handle XML namespaces properly
			removeNSPrefix: true, // This will remove the 'cap:' prefix
			// Alternative: keep namespaces with processNamespaces: true
		});

		// Create axios instance with custom configuration
		this.axiosInstance = axios.create({
			timeout: 120000,
			headers: {
				'User-Agent': 'CAP-Disaster-Alert-System/1.0',
				Accept: 'application/xml, text/xml, */*',
				'Accept-Encoding': 'gzip, deflate',
				Connection: 'keep-alive',
			},
			// HTTP Agent settings to handle connections better
			httpAgent: new (require('http').Agent)({
				keepAlive: true,
				keepAliveMsecs: 1000,
				maxSockets: 10,
			}),
			httpsAgent: new (require('https').Agent)({
				keepAlive: true,
				keepAliveMsecs: 1000,
				maxSockets: 10,
				rejectUnauthorized: true,
			}),
		});

		// Configure retry logic
		axiosRetry(this.axiosInstance, {
			retries: 3, // Number of retry attempts
			retryDelay: retryCount => {
				// Exponential backoff: 1s, 2s, 4s
				return retryCount * 1000;
			},
			retryCondition: error => {
				// Retry on network errors or 5xx errors
				return (
					axiosRetry.isNetworkOrIdempotentRequestError(error) ||
					(error.response?.status && error.response.status >= 500)
				);
			},
			onRetry: (retryCount, error, requestConfig) => {
				console.log(`Retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`);
			},
		});
	}

	/**
	 * Fetch and parse RSS feed from any source
	 */
	async fetchRSSFeed(url: string): Promise<any[]> {
		try {
			const response = await this.axiosInstance.get(url);

			const parsed = this.xmlParser.parse(response.data);
			const items = parsed?.rss?.channel?.item || [];

			// Ensure items is always an array
			return Array.isArray(items) ? items : [items];
		} catch (error) {
			console.error(`Error fetching RSS feed from ${url}:`, error);
			// Log more details for debugging
			if (axios.isAxiosError(error)) {
				console.error('Error details:', {
					message: error.message,
					code: error.code,
					response: error.response?.status,
					responseText: error.response?.statusText,
				});
			}
			throw new Error(`Failed to fetch RSS feed from ${url}: ${error.message}`);
		}
	}

	/**
	 * Extract identifier from RSS item with multiple fallback strategies
	 */
	extractIdentifier(item: any): string | null {
		// Strategy 1: Try to extract from link
		if (item.link) {
			const linkMatch = item.link.match(/identifier=(\d+)/);
			if (linkMatch) return linkMatch[1];
		}

		// Strategy 2: Try to extract from guid
		if (item.guid) {
			// Sometimes guid might be just the identifier
			if (/^\d+$/.test(item.guid)) {
				return item.guid;
			}
			// Or it might be in a URL format
			const guidMatch = item.guid.match(/identifier=(\d+)/);
			if (guidMatch) return guidMatch[1];
		}

		// Strategy 3: Try to find identifier in other fields
		// Check if there's an identifier in the title or description
		const allText = `${item.title || ''} ${item.description || ''}`;
		const textMatch = allText.match(/\b(\d{16,})\b/); // Look for long numbers that might be identifiers
		if (textMatch) {
			console.log(`Found potential identifier in text: ${textMatch[1]}`);
			return textMatch[1];
		}

		console.warn('Could not extract identifier from RSS item:', item);
		return null;
	}

	/**
	 * Fetch and parse individual CAP XML
	 */
	async fetchCAPAlert(
		identifier: string,
		baseUrl: string = this.NDMA_CAP_URL
	): Promise<CAPAlert | null> {
		const url = `${baseUrl}${identifier}`;
		const cacheKey = `cap_${identifier}`;

		// Track request
		this.stats.totalRequests++;

		// Check cache first
		const cached = this.responseCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
			console.log(`Using cached CAP alert for ${identifier}`);
			this.stats.cacheHits++;
			return cached.data;
		}

		try {
			const response = await this.axiosInstance.get(url);

			const parsed = this.xmlParser.parse(response.data);
			const alert = parsed?.alert;

			if (!alert) {
				console.warn(`No alert data found for identifier ${identifier}`);
				return null;
			}

			const transformedAlert = this.transformCAPAlert(alert);

			// Cache the successful response
			this.responseCache.set(cacheKey, {
				data: transformedAlert,
				timestamp: Date.now(),
			});

			// Clean up old cache entries
			this.cleanupCache();

			this.stats.successfulRequests++;
			return transformedAlert;
		} catch (error) {
			this.stats.failedRequests++;
			this.stats.lastError = error;

			console.error(`Error fetching CAP alert ${identifier}:`, error);
			// Log more details for debugging
			if (axios.isAxiosError(error)) {
				console.error('Error details:', {
					url: url,
					message: error.message,
					code: error.code,
					response: error.response?.status,
					responseText: error.response?.statusText,
				});
			}

			// Try HTML parsing as fallback
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				console.log(`Trying HTML fallback for identifier ${identifier}`);
				const fallbackResult = await this.fetchCAPAlertFromHTML(identifier);
				if (fallbackResult) {
					this.stats.htmlFallbacks++;
					this.stats.successfulRequests++;
					this.stats.failedRequests--; // Correct the failed count since we recovered
				}
				return fallbackResult;
			}

			return null;
		}
	}

	/**
	 * Fallback method to fetch CAP alert by parsing HTML page
	 */
	private async fetchCAPAlertFromHTML(identifier: string): Promise<CAPAlert | null> {
		try {
			// Try to fetch the main page and extract XML link
			const pageUrl = `https://sachet.ndma.gov.in/cap_public_website/alert.html?identifier=${identifier}`;
			console.log(`Attempting HTML fallback from ${pageUrl}`);

			const response = await this.axiosInstance.get(pageUrl, {
				headers: {
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
			});

			// Look for XML link in the HTML
			const xmlLinkMatch = response.data.match(
				/href=['"]([^'"]*FetchXMLFile[^'"]*identifier[^'"]*)['"]/i
			);
			if (xmlLinkMatch) {
				const xmlUrl = xmlLinkMatch[1];
				console.log(`Found XML URL in HTML: ${xmlUrl}`);

				// Fetch the XML from the discovered URL
				const xmlResponse = await this.axiosInstance.get(xmlUrl);
				const parsed = this.xmlParser.parse(xmlResponse.data);
				const alert = parsed?.alert;

				if (alert) {
					return this.transformCAPAlert(alert);
				}
			}

			// Try to extract CAP data directly from HTML if embedded
			const capDataMatch = response.data.match(/<alert[^>]*>([\s\S]*?)<\/alert>/i);
			if (capDataMatch) {
				const xmlData = `<?xml version="1.0" encoding="UTF-8"?>${capDataMatch[0]}`;
				const parsed = this.xmlParser.parse(xmlData);
				if (parsed?.alert) {
					return this.transformCAPAlert(parsed.alert);
				}
			}

			console.warn(`Could not extract CAP data from HTML for identifier ${identifier}`);
			return null;
		} catch (error) {
			console.error(`HTML fallback failed for identifier ${identifier}:`, error);
			return null;
		}
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanupCache() {
		const now = Date.now();
		for (const [key, value] of this.responseCache.entries()) {
			if (now - value.timestamp > this.CACHE_TTL) {
				this.responseCache.delete(key);
			}
		}
	}

	/**
	 * Transform raw CAP XML to structured format
	 */
	private transformCAPAlert(rawAlert: any): CAPAlert {
		const info = Array.isArray(rawAlert.info) ? rawAlert.info : [rawAlert.info];
		return {
			identifier: rawAlert.identifier,
			sender: rawAlert.sender,
			sent: new Date(rawAlert.sent),
			status: rawAlert.status,
			msgType: rawAlert.msgType,
			scope: rawAlert.scope,
			code: rawAlert.code
				? Array.isArray(rawAlert.code)
					? rawAlert.code
					: [rawAlert.code]
				: undefined,
			note: rawAlert.note,
			references: rawAlert.references,
			incidents: rawAlert.incidents,
			info: info.map((infoItem: any) => ({
				language: infoItem.language,
				category: Array.isArray(infoItem.category) ? infoItem.category : [infoItem.category],
				event: infoItem.event,
				responseType: infoItem.responseType
					? Array.isArray(infoItem.responseType)
						? infoItem.responseType
						: [infoItem.responseType]
					: [],
				urgency: infoItem.urgency,
				severity: infoItem.severity,
				certainty: infoItem.certainty,
				audience: infoItem.audience,
				eventCode: infoItem.eventCode,
				effective: new Date(infoItem.effective),
				onset: infoItem.onset ? new Date(infoItem.onset) : undefined,
				expires: new Date(infoItem.expires),
				senderName: infoItem.senderName ?? 'NDMA India',
				headline: infoItem.headline,
				description: infoItem.description,
				instruction: infoItem.instruction,
				web: infoItem.web,
				contact: infoItem.contact,
				parameter: infoItem.parameter,
				area: this.transformAreas(infoItem.area),
			})),
		};
	}

	/**
	 * Transform area information
	 */
	private transformAreas(areas: any): any[] {
		if (!areas) return [];
		const areaArray = Array.isArray(areas) ? areas : [areas];

		return areaArray.map((area: any) => ({
			areaDesc: area.areaDesc,
			polygon: area.polygon
				? Array.isArray(area.polygon)
					? area.polygon
					: [area.polygon]
				: undefined,
			circle: area.circle ? (Array.isArray(area.circle) ? area.circle : [area.circle]) : undefined,
			geocode: area.geocode,
			altitude: area.altitude,
			ceiling: area.ceiling,
		}));
	}

	/**
	 * Fetch all current alerts from a specific source
	 */
	async fetchAlertsFromSource(source: CAPSource): Promise<CAPAlert[]> {
		const alerts: CAPAlert[] = [];
		let rssItems: any[] = [];

		try {
			rssItems = await this.fetchRSSFeed(source.url);
		} catch (error) {
			console.error(`Failed to fetch RSS feed from source ${source.name}:`, error);
			// Return empty array instead of throwing to allow scheduler to continue
			return alerts;
		}

		// Optimize by limiting the number of alerts processed per batch
		// This prevents overwhelming the system with too many requests at once
		const maxAlertsPerBatch = 20;
		const itemsToProcess = rssItems.slice(0, maxAlertsPerBatch);

		// Process each RSS item with error handling and rate limiting
		const processPromises = itemsToProcess.map(async (item, index) => {
			try {
				// Add a small delay between requests to prevent overwhelming the server
				if (index > 0) {
					await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
				}

				const identifier = this.extractIdentifier(item);
				if (identifier) {
					// Check cache first to avoid redundant requests
					const cacheKey = `cap_${identifier}`;
					const cached = this.responseCache.get(cacheKey);

					// Use longer cache for RSS items we've seen recently
					if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
						console.log(`Using cached CAP alert for ${identifier}`);
						const alert = cached.data;
						if (alert) {
							alert.sourceId = source._id;
							alert.sourceName = source.name;
							return alert;
						}
					}

					// For NDMA, use specific URL pattern
					const baseUrl = source.name === 'NDMA India' ? this.NDMA_CAP_URL : undefined;
					const alert = await this.fetchCAPAlert(identifier, baseUrl);
					if (alert) {
						// Add source information to alert
						alert.sourceId = source._id;
						alert.sourceName = source.name;
						return alert;
					}
				}
			} catch (itemError) {
				// Log error but continue processing other items
				console.error(`Error processing RSS item for source ${source.name}:`, itemError);
			}
			return null;
		});

		// Wait for all promises to complete and filter out null results
		const results = await Promise.allSettled(processPromises);
		for (const result of results) {
			if (result.status === 'fulfilled' && result.value) {
				alerts.push(result.value);
			}
		}

		console.log(
			`Successfully fetched ${alerts.length} alerts from ${source.name} (processed ${itemsToProcess.length} of ${rssItems.length} RSS items)`
		);

		// Log statistics periodically
		if (this.stats.totalRequests % 50 === 0) {
			this.logStatistics();
		}

		return alerts;
	}

	/**
	 * Get current statistics
	 */
	getStatistics() {
		const successRate =
			this.stats.totalRequests > 0
				? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2)
				: 0;
		const cacheHitRate =
			this.stats.totalRequests > 0
				? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(2)
				: 0;

		return {
			...this.stats,
			successRate: `${successRate}%`,
			cacheHitRate: `${cacheHitRate}%`,
			cacheSize: this.responseCache.size,
		};
	}

	/**
	 * Log statistics to console
	 */
	private logStatistics() {
		const stats = this.getStatistics();
		console.log('CAP Parser Statistics:', {
			totalRequests: stats.totalRequests,
			successful: stats.successfulRequests,
			failed: stats.failedRequests,
			successRate: stats.successRate,
			cacheHits: stats.cacheHits,
			cacheHitRate: stats.cacheHitRate,
			htmlFallbacks: stats.htmlFallbacks,
			cacheSize: stats.cacheSize,
		});
	}

	/**
	 * Fetch all current alerts (legacy method for backward compatibility)
	 */
	async fetchAllAlerts(): Promise<CAPAlert[]> {
		// Default to NDMA India for backward compatibility
		const defaultSource: CAPSource = {
			_id: 'default',
			name: 'NDMA India',
			url: this.NDMA_RSS_URL,
			country: 'India',
		};
		return this.fetchAlertsFromSource(defaultSource);
	}

	/**
	 * Parse polygon string to coordinates
	 */
	parsePolygon(polygonString: string): [number, number][] {
		const coords = polygonString.trim().split(/\s+/);
		const points: [number, number][] = [];

		for (let i = 0; i < coords.length; i += 2) {
			if (i + 1 < coords.length) {
				const lat = parseFloat(coords[i]);
				const lon = parseFloat(coords[i + 1]);
				if (!isNaN(lat) && !isNaN(lon)) {
					points.push([lat, lon]);
				}
			}
		}

		return points;
	}

	/**
	 * Parse circle string to center and radius
	 */
	parseCircle(circleString: string): { center: [number, number]; radius: number } | null {
		const parts = circleString.trim().split(/\s+/);
		if (parts.length >= 3) {
			const lat = parseFloat(parts[0]);
			const lon = parseFloat(parts[1]);
			const radius = parseFloat(parts[2]);

			if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius)) {
				return {
					center: [lat, lon],
					radius: radius * 1000, // Convert km to meters
				};
			}
		}
		return null;
	}

	/**
	 * Check if alert is currently active
	 */
	isAlertActive(alert: CAPAlert): boolean {
		const now = new Date();
		return alert.info.some(info => {
			const expires = new Date(info.expires);
			return expires > now;
		});
	}

	/**
	 * Get severity level (for color coding)
	 */
	getSeverityLevel(severity: string): number {
		const levels: { [key: string]: number } = {
			Extreme: 4,
			Severe: 3,
			Moderate: 2,
			Minor: 1,
			Unknown: 0,
		};
		return levels[severity] || 0;
	}
}

export default new CAPParserService();
export { CAPAlert, CAPParserService };
