import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import SirenMapView from '@/components/mapView/SirenMapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
	AlertCircle, 
	CheckCircle2, 
	Clock, 
	XCircle,
	Search,
	Filter,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	MapPin,
	Bell
} from 'lucide-react';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SirenStatusBadge from '@/components/sirenList/SirenStatusBadge';
import { Siren, SirenType } from '@/types';

const MapPage = () => {
	const { districts, sirens, loading, error, updateSiren } = useData();
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSiren, setSelectedSiren] = useState<Siren | null>(null);
	const [statusFilter, setStatusFilter] = useState<string[]>(['active', 'warning', 'alert', 'inactive']);
	const [typeFilter, setTypeFilter] = useState<SirenType[]>(['GPRS', 'Ethernet']);
	const sirenRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	useEffect(() => {
		const handleStatusChange = (data: { sirenId: string; status: string; lastChecked: Date }) => {
			updateSiren(data.sirenId, {
				status: data.status,
				lastChecked: data.lastChecked,
			});
		};

		socket.on('siren-status-change', handleStatusChange);

		return () => {
			socket.off('siren-status-change', handleStatusChange);
		};
	}, [updateSiren]); // Use updateSiren in dependency array instead of sirens

	// Scroll to selected siren in sidebar
	useEffect(() => {
		if (selectedSiren && sirenRefs.current[selectedSiren.id]) {
			sirenRefs.current[selectedSiren.id]?.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}
	}, [selectedSiren]);

	if (loading) return <div className='flex items-center justify-center h-screen'>Loading...</div>;
	if (error)
		return (
			<div className='flex items-center justify-center h-screen text-red-500'>Error: {error}</div>
		);

	const stats = {
		total: sirens.length,
		active: sirens.filter(s => s.status === 'active').length,
		warning: sirens.filter(s => s.status === 'warning').length,
		alert: sirens.filter(s => s.status === 'alert').length,
	};

	// Filter sirens based on search and filters
	const filteredSirens = sirens.filter(siren => {
		const matchesSearch = 
			siren.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			siren.location.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter.includes(siren.status);
		const matchesType = siren.type.some(t => typeFilter.includes(t));
		return matchesSearch && matchesStatus && matchesType;
	});

	// Handle status filter changes
	const handleStatusFilterChange = (status: string) => {
		setStatusFilter(prev => {
			if (prev.includes(status)) {
				return prev.filter(s => s !== status);
			} else {
				return [...prev, status];
			}
		});
	};

	// Handle type filter changes
	const handleTypeFilterChange = (type: SirenType) => {
		setTypeFilter(prev => {
			if (prev.includes(type)) {
				return prev.filter(t => t !== type);
			} else {
				return [...prev, type];
			}
		});
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

	return (
		<div className='h-screen flex flex-col bg-gray-900'>
			{/* Header with Stats */}
			<div className='p-4 pb-0'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Total Sirens</CardTitle>
							<Clock className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Active</CardTitle>
							<CheckCircle2 className='h-4 w-4 text-green-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats.active}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Warning</CardTitle>
							<AlertCircle className='h-4 w-4 text-yellow-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats.warning}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Alert</CardTitle>
							<XCircle className='h-4 w-4 text-red-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stats.alert}</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Content Area */}
			<div className='flex-1 flex overflow-hidden p-4 pt-2'>
				{/* Map */}
				<div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-4' : ''}`}>
					<SirenMapView 
						sirens={sirens} 
						selectedSiren={selectedSiren}
						onSirenSelect={setSelectedSiren}
					/>
				</div>

				{/* Toggle Button */}
				<Button
					variant='ghost'
					size='icon'
					className='absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
					onClick={() => setSidebarOpen(!sidebarOpen)}
				>
					{sidebarOpen ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
				</Button>

				{/* Sidebar */}
				<div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
					{sidebarOpen && (
						<div className='w-80 h-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg flex flex-col'>
							<div className='p-4 border-b border-gray-700 bg-gray-800/50'>
								<h2 className='text-lg font-semibold text-white mb-3'>Siren List</h2>

								{/* Search */}
								<div className='relative mb-3'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
									<Input
										placeholder='Search sirens...'
										className='pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400'
										value={searchTerm}
										onChange={e => setSearchTerm(e.target.value)}
									/>
								</div>

								{/* Filter */}
								<div className='flex justify-between items-center'>
									<span className='text-sm text-gray-300'>{filteredSirens.length} sirens</span>
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
											<div className='px-2 py-1 text-sm font-medium text-gray-400'>Status</div>
											<DropdownMenuCheckboxItem
												checked={statusFilter.includes('active')}
												onCheckedChange={() => handleStatusFilterChange('active')}
												className='text-white hover:bg-gray-700'
											>
												Active
											</DropdownMenuCheckboxItem>
											<DropdownMenuCheckboxItem
												checked={statusFilter.includes('warning')}
												onCheckedChange={() => handleStatusFilterChange('warning')}
												className='text-white hover:bg-gray-700'
											>
												Warning
											</DropdownMenuCheckboxItem>
											<DropdownMenuCheckboxItem
												checked={statusFilter.includes('alert')}
												onCheckedChange={() => handleStatusFilterChange('alert')}
												className='text-white hover:bg-gray-700'
											>
												Alert
											</DropdownMenuCheckboxItem>
											<DropdownMenuCheckboxItem
												checked={statusFilter.includes('inactive')}
												onCheckedChange={() => handleStatusFilterChange('inactive')}
												className='text-white hover:bg-gray-700'
											>
												Inactive
											</DropdownMenuCheckboxItem>
											<div className='border-t border-gray-700 my-1'></div>
											<div className='px-2 py-1 text-sm font-medium text-gray-400'>Type</div>
											<DropdownMenuCheckboxItem
												checked={typeFilter.includes('GPRS')}
												onCheckedChange={() => handleTypeFilterChange('GPRS')}
												className='text-white hover:bg-gray-700'
											>
												GPRS
											</DropdownMenuCheckboxItem>
											<DropdownMenuCheckboxItem
												checked={typeFilter.includes('Ethernet')}
												onCheckedChange={() => handleTypeFilterChange('Ethernet')}
												className='text-white hover:bg-gray-700'
											>
												Ethernet
											</DropdownMenuCheckboxItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							{/* Siren List */}
							<div className='flex-1 overflow-y-auto'>
								{filteredSirens.length === 0 ? (
									<div className='p-4 text-center text-gray-400'>
										<Bell className='h-8 w-8 mx-auto mb-2 text-gray-500' />
										<p>No sirens found</p>
									</div>
								) : (
									<div className='space-y-1 p-2'>
										{filteredSirens.map(siren => (
											<Card
												key={siren.id}
												ref={el => sirenRefs.current[siren.id] = el}
												className={`cursor-pointer transition-all hover:shadow-md bg-gray-750 border-gray-600 hover:bg-gray-700 ${
													selectedSiren?.id === siren.id
														? 'ring-2 ring-blue-500 shadow-md bg-gray-700'
														: ''
												}`}
												onClick={() => setSelectedSiren(siren)}
											>
												<CardContent className='p-3'>
													<div className='space-y-2'>
														<div className='flex items-start justify-between gap-2'>
															<h3 className='font-medium text-sm leading-tight text-white'>
																{siren.name}
															</h3>
															<SirenStatusBadge status={siren.status} />
														</div>

														<div className='flex items-center gap-1 text-xs text-gray-400'>
															<MapPin className='h-3 w-3' />
															<span className='truncate'>{siren.location}</span>
														</div>

														<div className='flex items-center justify-between text-xs text-gray-400'>
															<span>{siren.type.join(', ')}</span>
															<div className='flex items-center gap-1'>
																<Clock className='h-3 w-3' />
																<span>{formatRelativeTime(new Date(siren.lastChecked))}</span>
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MapPage;
