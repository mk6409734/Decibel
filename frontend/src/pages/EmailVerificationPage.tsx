import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

const EmailVerificationPage = () => {
	const { verificationToken } = useParams();
	const navigate = useNavigate();
	const [isVerifying, setIsVerifying] = useState(true);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		const verifyEmail = async () => {
			if (!verificationToken) {
				setError('Invalid verification link');
				setIsVerifying(false);
				return;
			}

			try {
				const response = await axios.get(`${API_BASE_URL}/api/auth/confirm/${verificationToken}`);
				
				if (response.data.emailVerification !== false) {
					setIsSuccess(true);
					toast.success('Email verified successfully! You can now sign in.');
				} else {
					setError('Email verification failed. Please try again.');
				}
			} catch (error: any) {
				const errorMessage = error.response?.data?.errors?.message || 'Email verification failed. Please try again.';
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setIsVerifying(false);
			}
		};

		verifyEmail();
	}, [verificationToken]);

	if (isVerifying) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-background'>
				<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
					<h2 className='text-xl font-semibold text-foreground'>Verifying your email...</h2>
					<p className='text-sm text-muted-foreground'>Please wait while we verify your email address.</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border text-center'>
				{isSuccess ? (
					<>
						<div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
							<svg
								className='w-8 h-8 text-green-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 13l4 4L19 7'
								/>
							</svg>
						</div>
						<div>
							<h2 className='text-2xl font-bold text-foreground'>Email Verified!</h2>
							<p className='mt-2 text-sm text-muted-foreground'>
								Your email has been successfully verified. You can now sign in to your account.
							</p>
						</div>
						<div className='space-y-4'>
							<Link
								to='/login'
								className='w-full inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
							>
								Sign In
							</Link>
						</div>
					</>
				) : (
					<>
						<div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto'>
							<svg
								className='w-8 h-8 text-red-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</div>
						<div>
							<h2 className='text-2xl font-bold text-foreground'>Verification Failed</h2>
							<p className='mt-2 text-sm text-muted-foreground'>
								{error || 'We were unable to verify your email address. Please try again.'}
							</p>
						</div>
						<div className='space-y-4'>
							<Link
								to='/login'
								className='w-full inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
							>
								Back to Sign In
							</Link>
							<Link
								to='/register'
								className='w-full inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
							>
								Create New Account
							</Link>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default EmailVerificationPage;
