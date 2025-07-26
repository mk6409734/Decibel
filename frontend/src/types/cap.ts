export interface CAPArea {
  areaDesc: string;
  polygon?: string[];
  circle?: string[];
  geocode?: any[];
  altitude?: number;
  ceiling?: number;
  geoJson?: {
    type: 'Polygon' | 'Circle' | 'MultiPolygon';
    coordinates: any;
  };
}

export interface CAPInfo {
  language: string;
  category: string[];
  event: string;
  responseType: string[];
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
  audience?: string;
  eventCode?: any[];
  effective: string;
  onset?: string;
  expires: string;
  senderName: string;
  headline: string;
  description: string;
  instruction?: string;
  web?: string;
  contact?: string;
  parameter?: any[];
  area: CAPArea[];
}

export interface CAPAlert {
  _id: string;
  identifier: string;
  sender: string;
  sent: string;
  status: 'Actual' | 'Exercise' | 'System' | 'Test' | 'Draft';
  msgType: 'Alert' | 'Update' | 'Cancel' | 'Ack' | 'Error';
  scope: 'Public' | 'Restricted' | 'Private';
  sourceId?: string;
  sourceName?: string;
  code?: string[];
  note?: string;
  references?: string;
  incidents?: string;
  info: CAPInfo[];
  fetchedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CAPAlertStats {
  total: number;
  active: number;
  severity: Array<{ _id: string; count: number }>;
  category: Array<{ _id: string; count: number }>;
}

export interface CAPAlertResponse {
  success: boolean;
  message?: string;
  alert?: CAPAlert;
  alerts?: CAPAlert[];
  count?: number;
  stats?: CAPAlertStats;
  error?: string;
}

export interface CAPSource {
  _id: string;
  name: string;
  url: string;
  country: string;
  language: string;
  isActive: boolean;
  isDefault: boolean;
  fetchInterval: number;
  lastFetched?: string;
  description?: string;
  metadata?: {
    provider?: string;
    contactEmail?: string;
    documentation?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CAPSourceResponse {
  success: boolean;
  message?: string;
  source?: CAPSource;
  sources?: CAPSource[];
  count?: number;
  error?: string;
}

// Helper functions for CAP alerts
export const getSeverityColor = (severity: CAPInfo['severity']): string => {
  const colors: Record<CAPInfo['severity'], string> = {
    'Extreme': '#DC2626', // red-600
    'Severe': '#EA580C',  // orange-600
    'Moderate': '#CA8A04', // yellow-600
    'Minor': '#2563EB',   // blue-600
    'Unknown': '#6B7280', // gray-500
  };
  return colors[severity] || colors['Unknown'];
};

export const getSeverityLevel = (severity: CAPInfo['severity']): number => {
  const levels: Record<CAPInfo['severity'], number> = {
    'Extreme': 4,
    'Severe': 3,
    'Moderate': 2,
    'Minor': 1,
    'Unknown': 0,
  };
  return levels[severity] || 0;
};

export const getUrgencyIcon = (urgency: CAPInfo['urgency']): string => {
  const icons: Record<CAPInfo['urgency'], string> = {
    'Immediate': '🚨',
    'Expected': '⚠️',
    'Future': '📅',
    'Past': '📆',
    'Unknown': '❓',
  };
  return icons[urgency] || icons['Unknown'];
};

export const getCertaintyLabel = (certainty: CAPInfo['certainty']): string => {
  const labels: Record<CAPInfo['certainty'], string> = {
    'Observed': 'Confirmed',
    'Likely': 'Very Likely',
    'Possible': 'Possible',
    'Unlikely': 'Unlikely',
    'Unknown': 'Unknown',
  };
  return labels[certainty] || labels['Unknown'];
};

export const formatAlertTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

export const isAlertExpired = (alert: CAPAlert): boolean => {
  const now = new Date();
  return alert.info.every(info => new Date(info.expires) < now);
};

export const getAlertDuration = (info: CAPInfo): string => {
  const start = new Date(info.effective);
  const end = new Date(info.expires);
  const duration = end.getTime() - start.getTime();
  
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};