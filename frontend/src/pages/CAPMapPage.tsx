import React, { useEffect, useState } from 'react';
import CAPMapView from '@/components/mapView/CAPMapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	AlertTriangle,
	Shield,
	Info,
	Activity,
	RefreshCw,
	Search,
	Filter,
	ChevronDown,
	Clock,
	MapPin,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { socket } from '@/lib/socket';
import { CAPAlert } from '@/types/cap';
import { capAlertService } from '@/services/capApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CAPMapPage = () => {
	const [capAlerts, setCapAlerts] = useState<CAPAlert[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedAlert, setSelectedAlert] = useState<CAPAlert | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [severityFilter, setSeverityFilter] = useState<string[]>([
		'Extreme',
		'Severe',
		'Moderate',
		'Minor',
	]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const { toast } = useToast();

	// Fetch active alerts on mount
	useEffect(() => {
		fetchActiveAlerts();
	}, []);

	// Set up WebSocket listeners for real-time updates
	useEffect(() => {
		const handleNewAlert = (alert: CAPAlert) => {
			setCapAlerts(prev => [alert, ...prev]);
			toast({
				title: 'New Alert',
				description: alert.info[0]?.headline || 'New disaster alert received',
				variant: alert.info[0]?.severity === 'Extreme' ? 'destructive' : 'default',
			});
		};

		const handleUpdateAlert = (alert: CAPAlert) => {
			setCapAlerts(prev => prev.map(a => (a._id === alert._id ? alert : a)));
		};

		socket.on('cap-alert-new', handleNewAlert);
		socket.on('cap-alert-update', handleUpdateAlert);

		return () => {
			socket.off('cap-alert-new', handleNewAlert);
			socket.off('cap-alert-update', handleUpdateAlert);
		};
	}, [toast]);

	// Fetch active alerts
	const fetchActiveAlerts = async () => {
		try {
			setLoading(true);
			setError(null);
			const alerts = await capAlertService.getActiveAlerts();
			setCapAlerts(alerts);
		} catch (err) {
			setError('Failed to fetch alerts');
			console.error('Error fetching alerts:', err);
		} finally {
			setLoading(false);
		}
	};

	// Refresh alerts manually
	const refreshAlerts = async () => {
		try {
			setRefreshing(true);
			const response = await capAlertService.refreshAlerts();
			if (response.success) {
				toast({
					title: 'Alerts Refreshed',
					description: `Fetched ${response.alerts?.length || 0} alerts`,
				});
				fetchActiveAlerts();
			}
		} catch (err) {
			toast({
				title: 'Refresh Failed',
				description: 'Failed to refresh alerts',
				variant: 'destructive',
			});
		} finally {
			setRefreshing(false);
		}
	};

	// Handle severity filter changes
	const handleSeverityFilterChange = (severity: string) => {
		setSeverityFilter(prev => {
			if (prev.includes(severity)) {
				return prev.filter(s => s !== severity);
			} else {
				return [...prev, severity];
			}
		});
	};

	// Filter alerts based on search and severity
	const filteredAlerts = capAlerts.filter(alert => {
		const matchesSearch =
			alert.info[0]?.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alert.info[0]?.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			alert.info[0]?.area?.[0]?.areaDesc?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesSeverity = alert.info.some(info => severityFilter.includes(info.severity));

		return matchesSearch && matchesSeverity;
	});

	// Calculate pagination
	const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, severityFilter]);

	// Calculate statistics
	const stats = {
		total: capAlerts.length,
		extreme: capAlerts.filter(a => a.info.some(i => i.severity === 'Extreme')).length,
		severe: capAlerts.filter(a => a.info.some(i => i.severity === 'Severe')).length,
		moderate: capAlerts.filter(a => a.info.some(i => i.severity === 'Moderate')).length,
		minor: capAlerts.filter(a => a.info.some(i => i.severity === 'Minor')).length,
	};

	// Get severity badge classes for dark mode
	const getSeverityBadgeClass = (severity: string) => {
		switch (severity) {
			case 'Extreme':
				return 'bg-red-900/30 text-red-300 border-red-700/50';
			case 'Severe':
				return 'bg-orange-900/30 text-orange-300 border-orange-700/50';
			case 'Moderate':
				return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50';
			case 'Minor':
				return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
			default:
				return 'bg-gray-800/30 text-gray-300 border-gray-700/50';
		}
	};

	// Format relative time
	const formatRelativeTime = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return 'Just now';
	};

	// Pagination handlers
	const handlePrevPage = () => {
		setCurrentPage(prev => Math.max(1, prev - 1));
	};

	const handleNextPage = () => {
		setCurrentPage(prev => Math.min(totalPages, prev + 1));
	};

	if (loading)
		return (
			<div className='flex items-center justify-center h-screen text-white'>
				Loading CAP alerts...
			</div>
		);
	if (error)
		return (
			<div className='flex items-center justify-center h-screen text-red-400'>
				Error: {error}
				<Button onClick={fetchActiveAlerts} className='ml-4'>
					Retry
				</Button>
			</div>
		);

	return (
		<div className='h-screen flex flex-col overflow-hidden bg-gray-900'>
			{/* Header with Stats */}
			<div className='bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 border-b border-gray-700 shadow-lg'>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
					<div>
						<h1 className='text-xl font-bold text-white'>Disaster Alert Monitoring - NDMA India</h1>
						<div className='flex gap-4 mt-2'>
							<div className='flex items-center gap-2'>
								<Activity className='h-4 w-4 text-blue-400' />
								<span className='text-sm text-gray-300'>{stats.total} Total</span>
							</div>
							<div className='flex items-center gap-2'>
								<AlertTriangle className='h-4 w-4 text-red-400' />
								<span className='text-sm text-gray-300'>{stats.extreme} Extreme</span>
							</div>
							<div className='flex items-center gap-2'>
								<Shield className='h-4 w-4 text-orange-400' />
								<span className='text-sm text-gray-300'>{stats.severe} Severe</span>
							</div>
						</div>
					</div>
					<Button
						onClick={refreshAlerts}
						disabled={refreshing}
						variant='secondary'
						size='sm'
						className='shrink-0 bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
					>
						<RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Map */}
				<div className='flex-1'>
					<CAPMapView
						capAlerts={paginatedAlerts}
						onAlertClick={setSelectedAlert}
						selectedAlert={selectedAlert}
					/>
				</div>

				{/* Alerts Sidebar */}
				<div className='w-80 bg-gray-800 border-l border-gray-700 shadow-lg flex flex-col'>
					<div className='p-4 border-b border-gray-700 bg-gray-800/50'>
						<h2 className='text-lg font-semibold text-white mb-3'>Active Alerts</h2>

						{/* Search */}
						<div className='relative mb-3'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
							<Input
								placeholder='Search alerts...'
								className='pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</div>

						{/* Filter */}
						<div className='flex justify-between items-center'>
							<span className='text-sm text-gray-300'>
								{filteredAlerts.length > 0
									? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAlerts.length)} of ${
											filteredAlerts.length
									  } alerts`
									: '0 alerts'}
							</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='outline'
										size='sm'
										className='bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
									>
										<Filter className='h-4 w-4 mr-2' />
										Filter
										<ChevronDown className='h-4 w-4 ml-2' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className='bg-gray-800 border-gray-700'>
									<DropdownMenuCheckboxItem
										checked={severityFilter.includes('Extreme')}
										onCheckedChange={() => handleSeverityFilterChange('Extreme')}
										className='text-white hover:bg-gray-700'
									>
										Extreme
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={severityFilter.includes('Severe')}
										onCheckedChange={() => handleSeverityFilterChange('Severe')}
										className='text-white hover:bg-gray-700'
									>
										Severe
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={severityFilter.includes('Moderate')}
										onCheckedChange={() => handleSeverityFilterChange('Moderate')}
										className='text-white hover:bg-gray-700'
									>
										Moderate
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={severityFilter.includes('Minor')}
										onCheckedChange={() => handleSeverityFilterChange('Minor')}
										className='text-white hover:bg-gray-700'
									>
										Minor
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Pagination Controls */}
						{filteredAlerts.length > itemsPerPage && (
							<div className='flex justify-between items-center mt-3 pt-3 border-t border-gray-700'>
								<Button
									variant='outline'
									size='sm'
									onClick={handlePrevPage}
									disabled={currentPage === 1}
									className='bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50'
								>
									<ChevronLeft className='h-4 w-4 mr-1' />
									Prev
								</Button>
								<span className='text-sm text-gray-300'>
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant='outline'
									size='sm'
									onClick={handleNextPage}
									disabled={currentPage === totalPages}
									className='bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50'
								>
									Next
									<ChevronRight className='h-4 w-4 ml-1' />
								</Button>
							</div>
						)}
					</div>

					{/* Alerts List */}
					<div className='flex-1 overflow-y-auto'>
						{paginatedAlerts.length === 0 ? (
							<div className='p-4 text-center text-gray-400'>
								<Info className='h-8 w-8 mx-auto mb-2 text-gray-500' />
								<p>No active alerts</p>
							</div>
						) : (
							<div className='space-y-1 p-2'>
								{paginatedAlerts.map(alert => (
									<Card
										key={alert._id}
										className={`cursor-pointer transition-all hover:shadow-md bg-gray-750 border-gray-600 hover:bg-gray-700 ${
											selectedAlert?._id === alert._id
												? 'ring-2 ring-blue-500 shadow-md bg-gray-700'
												: ''
										}`}
										onClick={() => setSelectedAlert(alert)}
									>
										<CardContent className='p-3'>
											<div className='space-y-2'>
												<div className='flex items-start justify-between gap-2'>
													<h3 className='font-medium text-sm leading-tight text-white'>
														{alert.info[0]?.headline}
													</h3>
													<span
														className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadgeClass(
															alert.info[0]?.severity
														)}`}
													>
														{alert.info[0]?.severity}
													</span>
												</div>

												<p className='text-xs text-gray-300 font-medium'>{alert.info[0]?.event}</p>

												{alert.info[0]?.area?.[0]?.areaDesc && (
													<div className='flex items-center gap-1 text-xs text-gray-400'>
														<MapPin className='h-3 w-3' />
														<span className='truncate'>{alert.info[0].area[0].areaDesc}</span>
													</div>
												)}

												<div className='flex items-center justify-between text-xs text-gray-400'>
													<div className='flex items-center gap-1'>
														<Clock className='h-3 w-3' />
														<span>{formatRelativeTime(new Date(alert.sent))}</span>
													</div>
													<span>
														Expires: {new Date(alert.info[0]?.expires).toLocaleDateString()}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>

					{/* Selected Alert Details */}
					{selectedAlert && (
						<div className='border-t border-gray-700 bg-gray-800/50 p-4 max-h-64 overflow-y-auto'>
							<div className='space-y-3'>
								<div>
									<h4 className='font-medium text-white mb-1'>Description</h4>
									<p className='text-sm text-gray-300 leading-relaxed'>
										{selectedAlert.info[0]?.description}
									</p>
								</div>

								{selectedAlert.info[0]?.instruction && (
									<div>
										<h4 className='font-medium text-white mb-1'>Instructions</h4>
										<p className='text-sm text-gray-300 leading-relaxed'>
											{selectedAlert.info[0].instruction}
										</p>
									</div>
								)}

								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<span className='font-medium text-white'>Urgency:</span>
										<p className='text-gray-300'>{selectedAlert.info[0]?.urgency}</p>
									</div>
									<div>
										<span className='font-medium text-white'>Certainty:</span>
										<p className='text-gray-300'>{selectedAlert.info[0]?.certainty}</p>
									</div>
								</div>

								<div>
									<span className='font-medium text-white'>Source:</span>
									<p className='text-sm text-gray-300'>{selectedAlert.info[0]?.senderName}</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CAPMapPage;
