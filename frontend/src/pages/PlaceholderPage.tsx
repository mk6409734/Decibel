import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface PlaceholderPageProps {
	title: string;
	icon: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon }) => {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		// Set up an interval to update the time every second
		const intervalId = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		// Clean up the interval when the component unmounts
		return () => clearInterval(intervalId);
	}, []);

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold'>{title}</h1>
				<div className='text-sm text-gray-400'>Last updated: {currentTime.toLocaleString()}</div>
			</div>

			<Card className='bg-industrial-dark border-industrial-steel/30'>
				<CardHeader className='text-center pb-4'>
					<div className='flex justify-center mb-4'>
						<div className='h-16 w-16 bg-industrial-steel/20 rounded-full flex items-center justify-center'>
							{icon}
						</div>
					</div>
					<CardTitle className='text-xl'>{title} Module</CardTitle>
				</CardHeader>
				<CardContent className='text-center'>
					<p className='text-gray-400 max-w-md mx-auto'>
						Please contact your administrator to activate this module.
					</p>
					<div className='mt-4 py-4 px-8 bg-industrial-steel/10 rounded-md inline-block'>
						<div className='flex items-center gap-4'>
							<Wrench className='h-6 w-6 text-industrial-yellow' />
							<span>Requires Admin Approval</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default PlaceholderPage;
