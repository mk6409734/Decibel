import React from 'react';
import { Siren, Location, District } from '@/types';
import SirenList from './SirenList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, AlertTriangle, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

interface SirenDashboardProps {
	sirens: District[];
}

const SirenDashboard: React.FC<SirenDashboardProps> = ({ sirens }) => {
	// Flatten all sirens to calculate statistics
	const allSirens = sirens.flatMap(district => district.blocks.flatMap(block => block.sirens));

	const activeCount = allSirens.filter(s => s.status === 'active').length;
	const inactiveCount = allSirens.filter(s => s.status === 'inactive').length;
	const warningCount = allSirens.filter(s => s.status === 'warning').length;
	const alertCount = allSirens.filter(s => s.status === 'alert').length;

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card className='bg-industrial-dark border-industrial-steel/30'>
					<CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
						<CardTitle className='text-sm font-medium'>Active Sirens</CardTitle>
						<CheckCircle2 className='h-4 w-4 text-green-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{activeCount}</div>
						<p className='text-xs text-muted-foreground'>
							{Math.round((activeCount / allSirens.length) * 100)}% of total sirens
						</p>
					</CardContent>
				</Card>

				<Card className='bg-industrial-dark border-industrial-steel/30'>
					<CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
						<CardTitle className='text-sm font-medium'>Inactive Sirens</CardTitle>
						<WifiOff className='h-4 w-4 text-gray-400' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{inactiveCount}</div>
						<p className='text-xs text-muted-foreground'>
							{Math.round((inactiveCount / allSirens.length) * 100)}% of total sirens
						</p>
					</CardContent>
				</Card>

				<Card className='bg-industrial-dark border-industrial-steel/30'>
					<CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
						<CardTitle className='text-sm font-medium'>Warning Status</CardTitle>
						<AlertTriangle className='h-4 w-4 text-yellow-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{warningCount}</div>
						<p className='text-xs text-muted-foreground'>
							{Math.round((warningCount / allSirens.length) * 100)}% require attention
						</p>
					</CardContent>
				</Card>

				<Card className='bg-industrial-dark border-industrial-steel/30'>
					<CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
						<CardTitle className='text-sm font-medium'>Alert Status</CardTitle>
						<AlertCircle className='h-4 w-4 text-red-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{alertCount}</div>
						<p className='text-xs text-muted-foreground'>
							{Math.round((alertCount / allSirens.length) * 100)}% in critical state
						</p>
					</CardContent>
				</Card>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
				<div className='lg:col-span-3'>
					<SirenList sirens={sirens} />
				</div>

				<div className='space-y-4'>
					<Card className='bg-industrial-dark border-industrial-steel/30'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium'>District Summary</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							{sirens.map(district => {
								const districtSirens = district.blocks.flatMap(block => block.sirens);
								const sirenCount = districtSirens.length;
								const activeCount = districtSirens.filter(s => s.status === 'active').length;
								const warningCount = districtSirens.filter(s => s.status === 'warning').length;
								const alertCount = districtSirens.filter(s => s.status === 'alert').length;

								return (
									<div key={district.id} className='space-y-1'>
										<div className='flex justify-between items-center'>
											<span className='font-medium text-sm'>{district.name}</span>
											<span className='text-xs text-gray-400'>{sirenCount} sirens</span>
										</div>
										<div className='h-2 w-full bg-industrial-steel/30 rounded-full overflow-hidden'>
											<div
												className='h-full bg-green-500 rounded-full'
												style={{
													width: `${sirenCount > 0 ? (activeCount / sirenCount) * 100 : 0}%`,
												}}
											></div>
										</div>
										<div className='flex justify-between text-xs text-gray-400'>
											<span>Active: {activeCount}</span>
											<span>Warning: {warningCount}</span>
											<span>Alert: {alertCount}</span>
										</div>
									</div>
								);
							})}
						</CardContent>
					</Card>

					<Card className='bg-industrial-dark border-industrial-steel/30'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium'>System Notifications</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							<div className='flex items-start gap-2 pb-2 border-b border-industrial-steel/30'>
								<BellRing className='h-4 w-4 text-industrial-yellow mt-0.5' />
								<div>
									<p className='text-sm font-medium'>Scheduled Maintenance</p>
									<p className='text-xs text-gray-400'>System maintenance in 2 days</p>
								</div>
							</div>
							<div className='flex items-start gap-2 pb-2 border-b border-industrial-steel/30'>
								<AlertTriangle className='h-4 w-4 text-red-500 mt-0.5' />
								<div>
									<p className='text-sm font-medium'>System Alert</p>
									<p className='text-xs text-gray-400'>None</p>
								</div>
							</div>
							<div className='flex items-start gap-2'>
								<CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5' />
								<div>
									<p className='text-sm font-medium'>System Update Complete</p>
									<p className='text-xs text-gray-400'>All sirens updated to v1.0.1</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default SirenDashboard;
