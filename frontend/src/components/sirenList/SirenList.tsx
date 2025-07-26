import React, { useState } from 'react';
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react';
import { SirenType } from '@/types';
import SirenStatusBadge from './SirenStatusBadge';
import SirenControlDialog from '@/components/SirenControlDialog';

interface SirenListProps {
	sirens: any[];
	sendSignal?: (
		sirenId: string,
		type: string,
		value: any,
		alarmType: string,
		gapAudio: number,
		language: string
	) => void;
}

const SirenList: React.FC<SirenListProps> = ({ sirens, sendSignal }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [typeFilter, setTypeFilter] = useState<SirenType[]>(['GPRS', 'Ethernet']);
	const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>(null);
	const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

	// Dialog state
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedSiren, setSelectedSiren] = useState<any>(null);

	// Flatten all sirens for filtering
	const allSirens = sirens.flatMap(district => district.blocks.flatMap(block => block.sirens));

	const filteredSirens = allSirens.filter(siren => {
		const matchesSearch =
			siren.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			siren.location.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = siren.type.some(t => typeFilter.includes(t));
		return matchesSearch && matchesType;
	});

	const handleTypeFilterChange = (type: SirenType) => {
		setTypeFilter(prev => {
			if (prev.includes(type)) {
				return prev.filter(t => t !== type);
			} else {
				return [...prev, type];
			}
		});
	};

	const handleTestSiren = (siren: any, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent row expansion when clicking the button
		setSelectedSiren(siren);
		setIsDialogOpen(true);
	};

	const toggleDistrict = (districtId: string) => {
		setExpandedDistrictId(prev => (prev === districtId ? null : districtId));
		setExpandedBlockId(null); // Reset block expansion when district changes
	};

	const toggleBlock = (blockId: string) => {
		setExpandedBlockId(prev => (prev === blockId ? null : blockId));
	};

	return (
		<div className='space-y-4'>
			<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'></div>

			<div className='rounded border border-industrial-steel/30 overflow-hidden'>
				<div className='bg-industrial-blue text-white py-2 px-4 font-semibold flex items-center justify-between'>
					<div>Siren List</div>
					<div className='text-sm'>Total: {filteredSirens.length} sirens</div>
				</div>

				<div className='overflow-x-auto'>
					<Table>
						<TableHeader className='bg-industrial-gray'>
							<TableRow>
								<TableHead className='text-white'>Name</TableHead>
								<TableHead className='text-white'>Type</TableHead>
								<TableHead className='text-white'>Location</TableHead>
								<TableHead className='text-white'>Status</TableHead>
								<TableHead className='text-white'>Last Checked</TableHead>
								<TableHead className='text-white text-right'>Actions</TableHead>
							</TableRow>
						</TableHeader>
					</Table>
					<div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
						<Table>
							<TableBody>
								{sirens.map(district => (
									<React.Fragment key={district.id}>
										<TableRow
											className='border-industrial-steel/30 hover:bg-industrial-steel/10 cursor-pointer'
											onClick={() => toggleDistrict(district.id)}
										>
											<TableCell colSpan={6} className='font-medium'>
												<div className='flex items-center gap-2'>
													{district.name}
													{expandedDistrictId === district.id ? (
														<ChevronUp className='h-4 w-4 text-gray-400' />
													) : (
														<ChevronDown className='h-4 w-4 text-gray-400' />
													)}
												</div>
											</TableCell>
										</TableRow>
										{expandedDistrictId === district.id &&
											district.blocks.map(block => (
												<React.Fragment key={block.id}>
													<TableRow
														className='border-industrial-steel/30 hover:bg-industrial-steel/10 cursor-pointer'
														onClick={() => toggleBlock(block.id)}
													>
														<TableCell colSpan={6} className='pl-8 font-medium'>
															<div className='flex items-center gap-2'>
																{block.name}
																{expandedBlockId === block.id ? (
																	<ChevronUp className='h-4 w-4 text-gray-400' />
																) : (
																	<ChevronDown className='h-4 w-4 text-gray-400' />
																)}
															</div>
														</TableCell>
													</TableRow>
													{expandedBlockId === block.id &&
														block.sirens.map(siren => (
															<TableRow
																key={siren.id}
																className='border-industrial-steel/30 hover:bg-industrial-steel/10'
															>
																<TableCell className='pl-16'>{siren.name}</TableCell>
																<TableCell>{siren.type}</TableCell>
																<TableCell>{siren.location}</TableCell>
																<TableCell>
																	<SirenStatusBadge status={siren.status} />
																</TableCell>
																<TableCell className='text-sm text-gray-400'>
																	{new Date(siren.lastChecked).toLocaleString()}
																</TableCell>
																<TableCell className='text-right'>
																	<div className='flex justify-end gap-2'>
																		<Button
																			variant='ghost'
																			size='icon'
																			className='h-8 w-8 text-industrial-yellow'
																			onClick={e => handleTestSiren(siren, e)}
																		>
																			<Bell className='h-4 w-4' />
																		</Button>
																	</div>
																</TableCell>
															</TableRow>
														))}
												</React.Fragment>
											))}
									</React.Fragment>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>

			{/* Siren Control Dialog */}
			{selectedSiren && (
				<SirenControlDialog
					siren={selectedSiren}
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					sendSignal={sendSignal}
				/>
			)}
		</div>
	);
};

export default SirenList;
