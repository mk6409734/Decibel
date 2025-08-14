import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!email.trim()) {
			setError('Please enter your email address');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError('Please enter a valid email address');
			return;
		}

		setIsLoading(true);

		try {
			await axios.post(`${API_BASE_URL}/api/auth/forgot`, { email: email.trim() });
			setIsSubmitted(true);
			toast.success('Password reset email sent! Please check your inbox.');
		} catch (error: any) {
			const errorMessage = error.response?.data?.errors?.message || 'Failed to send reset email. Please try again.';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-background'>
				<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border text-center'>
					<div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto'>
						<svg
							className='w-8 h-8 text-blue-600'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
							/>
						</svg>
					</div>
					<div>
						<h2 className='text-2xl font-bold text-foreground'>Check your email</h2>
						<p className='mt-2 text-sm text-muted-foreground'>
							We've sent a password reset link to <strong>{email}</strong>
						</p>
						<p className='mt-4 text-sm text-muted-foreground'>
							Click the link in the email to reset your password. The link will expire in 12 hours.
						</p>
					</div>
					<div className='space-y-4'>
						<Link
							to='/login'
							className='w-full inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
						>
							Back to Sign In
						</Link>
						<button
							onClick={() => setIsSubmitted(false)}
							className='w-full inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
						>
							Send another email
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border'>
				<div className='text-center'>
					<h2 className='text-2xl font-bold tracking-tight text-foreground'>Reset your password</h2>
					<p className='mt-2 text-sm text-muted-foreground'>
						Enter your email address and we'll send you a link to reset your password.
					</p>
				</div>

				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div>
						<label htmlFor='email' className='block text-sm font-medium text-foreground'>
							Email address
						</label>
						<input
							id='email'
							name='email'
							type='email'
							required
							className='mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
							placeholder='Enter your email address'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					{error && (
						<div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>{error}</div>
					)}

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{isLoading ? 'Sending...' : 'Send reset link'}
						</button>
					</div>

					<div className='text-center'>
						<p className='text-sm text-muted-foreground'>
							Remember your password?{' '}
							<Link
								to='/login'
								className='font-medium text-primary hover:text-primary/90 transition-colors'
							>
								Sign in here
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
