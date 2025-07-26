import React, { useRef, useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Send, ChevronDown, Info } from 'lucide-react';
import { Siren } from '@/types';
import { socket } from '@/lib/socket';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SirenControlDialogProps {
	siren: Siren;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

const SirenControlDialog: React.FC<SirenControlDialogProps> = ({ siren, isOpen, onOpenChange }) => {
	// States for form values
	const [communicationType, setCommunicationType] = useState<string>('cell');
	const [alarmType, setAlarmType] = useState<string>('warning');
	const [playing, setPlaying] = useState(false);
	const [isWaitingForAck, setIsWaitingForAck] = useState(false);
	const [currentStatus, setCurrentStatus] = useState(siren.status);
	const [lastCheckedTime, setLastCheckedTime] = useState(siren.lastChecked);

	// Refs for form inputs
	const intervalRef = useRef<HTMLInputElement>(null);
	const langRef = useRef<HTMLInputElement>(null);
	const frequencyRef = useRef<HTMLInputElement>(null);
	const messageRef = useRef<HTMLTextAreaElement>(null);
	const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Socket event listeners
	useEffect(() => {
		const handleSirenAck = (data: { sirenId: string; running: boolean }) => {
			if (data.sirenId === siren.id) {
				setPlaying(data.running);
				setIsWaitingForAck(false);
			}
		};

		const handleStatusChange = (data: { sirenId: string; status: string; lastChecked: Date }) => {
			if (data.sirenId === siren.id) {
				setCurrentStatus(data.status as 'active' | 'inactive' | 'warning' | 'alert');
			}
		};

		// Listen for siren acknowledgements
		socket.on('siren-acked', handleSirenAck);

		// Listen for status changes
		socket.on('siren-status-change', handleStatusChange);

		// Setup status check interval
		if (isOpen) {
			// Start polling for status every 500ms
			statusIntervalRef.current = setInterval(() => {
				socket.emit('siren-status-check', siren.id);
			}, 500);
		}

		// Setup listener for status updates
		socket.on(
			'siren-status-update',
			(data: { sirenId: string; status: string; playing: boolean; lastChecked: Date }) => {
				if (data.sirenId === siren.id) {
					setCurrentStatus(data.status as 'active' | 'inactive' | 'warning' | 'alert');
					setPlaying(data.playing);
				}
			}
		);

		return () => {
			// Clean up event listeners
			socket.off('siren-acked', handleSirenAck);
			socket.off('siren-status-change', handleStatusChange);
			socket.off('siren-status-update');

			// Clear interval
			if (statusIntervalRef.current) {
				clearInterval(statusIntervalRef.current);
				statusIntervalRef.current = null;
			}
		};
	}, [siren.id, isOpen]);

	// Also handle open/close to manage interval
	useEffect(() => {
		if (!isOpen && statusIntervalRef.current) {
			clearInterval(statusIntervalRef.current);
			statusIntervalRef.current = null;
		} else if (isOpen && !statusIntervalRef.current) {
			statusIntervalRef.current = setInterval(() => {
				socket.emit('siren-status-check', siren.id);
			}, 500);
		}

		return () => {
			if (statusIntervalRef.current) {
				clearInterval(statusIntervalRef.current);
				statusIntervalRef.current = null;
			}
		};
	}, [isOpen, siren.id]);

	// Handler for toggling siren
	const handleToggleSiren = () => {
		if (isWaitingForAck) return;

		const newState = !playing;
		setIsWaitingForAck(true);

		socket.emit('siren-control', {
			sirenId: siren.id,
			action: newState ? 'on' : 'off',
			connType: communicationType,
			alertType: alarmType,
			gapAudio: Number(intervalRef.current?.value || 0),
			language: langRef.current?.value || 'en',
			frequency: Number(frequencyRef.current?.value || 1),
		});
	};

	// Handler for sending message
	const handleSendMessage = () => {
		if (messageRef.current?.value) {
			socket.emit('siren-control', {
				sirenId: siren.id,
				action: 'on',
				connType: communicationType,
				message: messageRef.current.value,
				alertType: alarmType,
				gapAudio: Number(intervalRef.current?.value || 0),
				language: langRef.current?.value || 'en',
				frequency: Number(frequencyRef.current?.value || 1),
			});

			// Clear message field after sending
			if (messageRef.current) {
				messageRef.current.value = '';
			}
		}
	};

	// Status badge variants
	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'default';
			case 'warning':
				return 'secondary';
			case 'alert':
				return 'destructive';
			default:
				return 'secondary';
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[650px] max-h-[85vh] overflow-auto bg-background border-border shadow-lg'>
				<DialogHeader className='border-b pb-4'>
					<DialogTitle className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<span className='text-xl font-semibold'>{siren.name}</span>
							<Badge variant={getStatusVariant(currentStatus)}>{currentStatus}</Badge>
						</div>
						<DialogClose asChild></DialogClose>
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6 py-4'>
					{/* Siren Information Section */}
					<Card className='shadow-sm'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-md flex items-center gap-2'>
								<Info className='h-4 w-4' /> Siren Information
							</CardTitle>
						</CardHeader>
						<CardContent className='p-4 pt-0'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-1'>
									<Label className='text-sm font-medium text-muted-foreground'>ID</Label>
									<p className='text-sm font-medium'>{siren.id}</p>
								</div>
								<div className='space-y-1'>
									<Label className='text-sm font-medium text-muted-foreground'>Location</Label>
									<p className='text-sm font-medium'>{siren.location}</p>
								</div>

								<div className='space-y-1'>
									<Label className='text-sm font-medium text-muted-foreground'>Type</Label>
									<p className='text-sm font-medium'>{siren.type.join(', ')}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Controls Section */}
					<div className='space-y-4'>
						<div className='flex items-center justify-between rounded-lg border p-4 bg-muted/30'>
							<div className='space-y-1'>
								<Label className='text-sm font-medium'>Siren Status</Label>
								<p className='text-sm text-muted-foreground'>
									{isWaitingForAck
										? 'Waiting for siren response...'
										: playing
										? 'Siren is currently active'
										: 'Siren is inactive'}
								</p>
							</div>
							<Switch id='toggle-siren' checked={playing} onCheckedChange={handleToggleSiren} />
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label className='text-sm font-medium'>Communication Medium</Label>
								<RadioGroup
									value={communicationType}
									onValueChange={setCommunicationType}
									className='space-y-2'
								>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='cell' id='communication-gprs' />
										<Label htmlFor='communication-gprs'>Cellular (4G/3G/2G)</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='eth' id='communication-ethernet' />
										<Label htmlFor='communication-ethernet'>Ethernet</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='sat' id='communication-vsat' />
										<Label htmlFor='communication-vsat'>VSAT</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='any' id='comm-any' />
										<Label htmlFor='comm-any'>Choose Best</Label>
									</div>
								</RadioGroup>
							</div>
							<div className='space-y-2'>
								<Label className='text-sm font-medium'>Alarm Type</Label>
								<RadioGroup value={alarmType} onValueChange={setAlarmType} className='space-y-2'>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='warning' id='alarm-warning' />
										<Label htmlFor='alarm-warning'>Warning</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='air-raid' id='alarm-air-raid' />
										<Label htmlFor='alarm-air-raid'>Air Raid</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='nuclear' id='alarm-nuclear' />
										<Label htmlFor='alarm-nuclear'>Nuclear</Label>
									</div>
									<div className='flex items-center space-x-2'>
										<RadioGroupItem value='navy' id='alarm-navy' />
										<Label htmlFor='alarm-navy'>Navy</Label>
									</div>
								</RadioGroup>
							</div>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='language' className='text-sm font-medium'>
									Language
								</Label>
								<Input
									id='language'
									ref={langRef}
									defaultValue='en'
									disabled={isWaitingForAck}
									className='bg-background'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='frequency' className='text-sm font-medium'>
									Frequency (times to repeat)
								</Label>
								<Input
									id='frequency'
									ref={frequencyRef}
									type='number'
									defaultValue='1'
									min='1'
									disabled={isWaitingForAck}
									className='bg-background'
								/>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='message' className='text-sm font-medium'>
								Text to transmit
							</Label>
							<Textarea
								id='message'
								ref={messageRef}
								placeholder='Enter message to broadcast'
								className='min-h-24 bg-background'
								disabled={isWaitingForAck || currentStatus !== 'active'}
							/>
						</div>
					</div>
				</div>

				<DialogFooter className='flex justify-end gap-2 border-t pt-4'>
					<Button
						variant={playing ? 'destructive' : 'default'}
						size='sm'
						onClick={handleToggleSiren}
						className='gap-2'
						disabled={isWaitingForAck || currentStatus !== 'active'}
					>
						{playing ? (
							<>
								<BellOff className='h-4 w-4' /> Stop Siren
							</>
						) : (
							<>
								<Bell className='h-4 w-4' /> Activate Siren
							</>
						)}
					</Button>
					<Button
						variant='default'
						size='sm'
						onClick={handleSendMessage}
						disabled={isWaitingForAck || currentStatus !== 'active'}
						className='gap-2'
					>
						<Send className='h-4 w-4' /> Send Message
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SirenControlDialog;
