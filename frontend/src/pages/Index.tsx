import { useEffect } from 'react';
import { useData } from '../context/DataContext';
import SirenDashboard from '@/components/sirenList/SirenDashboard';
import { socket } from '@/lib/socket';

const Index = () => {
	const { districts, sirens, loading, error, updateSiren } = useData();

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
	}, [updateSiren]);

	if (loading) return <div className='flex items-center justify-center h-screen'>Loading...</div>;

	if (error)
		return (
			<div className='flex items-center justify-center h-screen text-red-500'>Error: {error}</div>
		);

	return (
		<div className='p-4 space-y-6'>
			<SirenDashboard sirens={districts} />
		</div>
	);
};

export default Index;
