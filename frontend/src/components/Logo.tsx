import React from 'react';
import { Siren } from 'lucide-react';

const Logo: React.FC = () => {
	return (
		<div className='flex items-center gap-2 w-24 h-24'>
			<img src='/logo.png' className=''/>
			<img src='/police_logo.png' />
		</div>
	);
};

export default Logo;
