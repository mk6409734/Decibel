import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Activity,
  Download,
  Filter,
  Calendar,
  Users,
  Bell,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface SirenLog {
  id: string;
  name: string;
  location: string;
  type: string[];
  status: string;
  lastChecked: string;
  logs: LogEntry[];
}

interface LogEntry {
  action: string;
  timestamp: string;
  alertType: string;
  message: string;
}

interface AnalyticsData {
  totalSirens: number;
  totalExecutions: number;
  activeSirens: number;
  recentAlerts: number;
  alertTypes: { [key: string]: number };
  executionTrend: { date: string; count: number }[];
  topSirens: { name: string; executions: number }[];
}

const AlertAnalyticsDashboard: React.FC = () => {
  const [sirens, setSirens] = useState<SirenLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    dateRange: '7d',
    alertType: 'all',
    sirenStatus: 'all',
    search: ''
  });

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockSirens: SirenLog[] = [
          {
            id: 's001',
            name: 'Central Station Siren',
            location: 'Downtown Central',
            type: ['Warning', 'Emergency'],
            status: 'active',
            lastChecked: '2024-01-15T10:30:00Z',
            logs: [
              {
                action: 'ON',
                timestamp: '2024-01-15T10:25:00Z',
                alertType: 'warning',
                message: 'Severe weather warning issued'
              },
              {
                action: 'OFF',
                timestamp: '2024-01-15T10:28:00Z',
                alertType: 'warning',
                message: 'Weather warning cleared'
              },
              {
                action: 'ON',
                timestamp: '2024-01-15T10:28:00Z',
                alertType: 'warning',
                message: 'Weather warning cleared'
              }
            ]
          },
          {
            id: 's002',
            name: 'North District Siren',
            location: 'North Industrial Zone',
            type: ['Air Raid', 'Nuclear'],
            status: 'active',
            lastChecked: '2024-01-15T10:29:00Z',
            logs: [
              {
                action: 'ON',
                timestamp: '2024-01-15T09:15:00Z',
                alertType: 'air-raid',
                message: 'Emergency drill activation'
              }
            ]
          },
          {
            id: 's003',
            name: 'South Harbor Siren',
            location: 'Port Area',
            type: ['Navy', 'Warning'],
            status: 'inactive',
            lastChecked: '2024-01-15T09:45:00Z',
            logs: [
              {
                action: 'ON',
                timestamp: '2024-01-15T08:30:00Z',
                alertType: 'navy',
                message: 'Port security alert'
              },
              {
                action: 'OFF',
                timestamp: '2024-01-15T08:45:00Z',
                alertType: 'navy',
                message: 'Security alert resolved'
              }
            ]
          }
        ];

        setSirens(mockSirens);
        
        // Calculate analytics
        const analyticsData: AnalyticsData = {
          totalSirens: mockSirens.length,
          totalExecutions: mockSirens.reduce((sum, siren) => sum + siren.logs.length, 0),
          activeSirens: mockSirens.filter(s => s.status === 'active').length,
          recentAlerts: mockSirens.reduce((sum, siren) => 
            sum + siren.logs.filter(log => 
              new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length, 0
          ),
          alertTypes: mockSirens.reduce((acc, siren) => {
            siren.logs.forEach(log => {
              acc[log.alertType] = (acc[log.alertType] || 0) + 1;
            });
            return acc;
          }, {} as { [key: string]: number }),
          executionTrend: [
            { date: '2024-01-13', count: 5 },
            { date: '2024-01-14', count: 8 },
            { date: '2024-01-15', count: 12 }
          ],
          topSirens: mockSirens.map(siren => ({
            name: siren.name,
            executions: siren.logs.length
          })).sort((a, b) => b.executions - a.executions).slice(0, 5)
        };

        setAnalytics(analyticsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadXML = () => {
    // Create XML content similar to SirenList.tsx
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<siren_execution_logs>\n';
    xmlContent += '  <generated_at>' + new Date().toISOString() + '</generated_at>\n';
    xmlContent += '  <total_sirens>' + sirens.length + '</total_sirens>\n\n';

    sirens.forEach((siren) => {
      xmlContent += '  <siren>\n';
      xmlContent += '    <id>' + siren.id + '</id>\n';
      xmlContent += '    <name>' + siren.name + '</name>\n';
      xmlContent += '    <logs>\n';

      siren.logs.forEach((log) => {
        xmlContent += '      <log>\n';
        xmlContent += '        <action>' + log.action.toUpperCase() + '</action>\n';
        xmlContent += '        <timestamp>' + new Date(log.timestamp).toISOString() + '</timestamp>\n';
        xmlContent += '        <alert_type>' + (log.alertType || 'N/A') + '</alert_type>\n';
        xmlContent += '        <message>' + (log.message || 'N/A') + '</message>\n';
        xmlContent += '      </log>\n';
      });

      xmlContent += '    </logs>\n';
      xmlContent += '  </siren>\n';
    });

    xmlContent += '</siren_execution_logs>';

    // Download XML file
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'siren_analytics_logs.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Analytics XML report downloaded');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'warning': return 'bg-yellow-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'air-raid': return 'bg-red-100 text-red-800';
      case 'nuclear': return 'bg-purple-100 text-purple-800';
      case 'navy': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-300">Alert Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Comprehensive analysis of siren execution logs and alert patterns</p>
        </div>
        <Button onClick={handleDownloadXML} className="gap-2">
          <Download className="h-4 w-4" />
          Download XML Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={filter.dateRange} onValueChange={(value) => setFilter({...filter, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alertType">Alert Type</Label>
              <Select value={filter.alertType} onValueChange={(value) => setFilter({...filter, alertType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="air-raid">Air Raid</SelectItem>
                  <SelectItem value="nuclear">Nuclear</SelectItem>
                  <SelectItem value="navy">Navy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sirenStatus">Siren Status</Label>
              <Select value={filter.sirenStatus} onValueChange={(value) => setFilter({...filter, sirenStatus: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                placeholder="Search sirens..."
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sirens</p>
                <p className="text-2xl font-bold text-gray-300">{analytics?.totalSirens}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-300">{analytics?.totalExecutions}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sirens</p>
                <p className="text-2xl font-bold text-gray-300">{analytics?.activeSirens}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Alerts</p>
                <p className="text-2xl font-bold text-gray-300">{analytics?.recentAlerts}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Alert Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.alertTypes && Object.entries(analytics.alertTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getAlertTypeColor(type)}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / analytics.totalExecutions) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Sirens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Sirens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topSirens.map((siren, index) => (
                <div key={siren.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{siren.name}</p>
                      <p className="text-sm text-gray-500">{siren.executions} executions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Execution Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siren</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Alert Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sirens.flatMap(siren => 
                siren.logs.map((log, index) => (
                  <TableRow key={`${siren.id}-${index}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{siren.name}</p>
                        <p className="text-sm text-gray-500">{siren.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.action === 'ON' ? 'default' : 'secondary'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAlertTypeColor(log.alertType)}>
                        {log.alertType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(siren.status)}`}></div>
                        <span className="text-sm capitalize">{siren.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertAnalyticsDashboard;
