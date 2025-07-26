import { useState } from 'react';
import { LoginCredentials } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
	const { login, isLoading } = useAuth();
	const [formData, setFormData] = useState<LoginCredentials>({
		email: '',
		password: '',
	});
	const [error, setError] = useState<string>('');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			await login(formData);
			// Login successful - redirect is handled in the AuthContext
		} catch (err) {
			setError('Invalid credentials. Please try again.');
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border'>
				<div className='text-center'>
					<h2 className='text-2xl font-bold tracking-tight text-foreground'>Welcome back</h2>
					<p className='mt-2 text-sm text-muted-foreground'>Sign in to your account to continue</p>
				</div>
				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-4'>
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
								placeholder='Enter your email'
								value={formData.email}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label htmlFor='password' className='block text-sm font-medium text-foreground'>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								required
								className='mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
								placeholder='Enter your password'
								value={formData.password}
								onChange={handleChange}
							/>
						</div>
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
							{isLoading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;
