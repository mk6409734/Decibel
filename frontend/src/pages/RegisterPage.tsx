import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth';
import { toast } from 'sonner';

interface RegisterFormData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

const RegisterPage = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState<RegisterFormData>({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

	const validateForm = (): boolean => {
		const newErrors: Partial<RegisterFormData> = {};

		// Name validation
		if (!formData.name.trim()) {
			newErrors.name = 'Name is required';
		} else if (formData.name.trim().length < 2) {
			newErrors.name = 'Name must be at least 2 characters long';
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!emailRegex.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address';
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters long';
		}

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));

		// Clear error when user starts typing
		if (errors[name as keyof RegisterFormData]) {
			setErrors(prev => ({
				...prev,
				[name]: undefined,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			await register({
				name: formData.name.trim(),
				email: formData.email.trim(),
				password: formData.password,
			});

			toast.success('Registration successful! Please check your email to verify your account.');
			navigate('/login');
		} catch (error: any) {
			const errorMessage = error.response?.data?.errors?.message || 'Registration failed. Please try again.';
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border'>
				<div className='text-center'>
					<h2 className='text-2xl font-bold tracking-tight text-foreground'>Create your account</h2>
					<p className='mt-2 text-sm text-muted-foreground'>
						Join Decibel to manage emergency alerts and siren systems
					</p>
				</div>

				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-4'>
						<div>
							<label htmlFor='name' className='block text-sm font-medium text-foreground'>
								Full Name
							</label>
							<input
								id='name'
								name='name'
								type='text'
								required
								className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 ${
									errors.name
										? 'border-destructive bg-background focus:ring-destructive'
										: 'border-input bg-background focus:ring-ring'
								}`}
								placeholder='Enter your full name'
								value={formData.name}
								onChange={handleChange}
							/>
							{errors.name && (
								<p className='mt-1 text-sm text-destructive'>{errors.name}</p>
							)}
						</div>

						<div>
							<label htmlFor='email' className='block text-sm font-medium text-foreground'>
								Email Address
							</label>
							<input
								id='email'
								name='email'
								type='email'
								required
								className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 ${
									errors.email
										? 'border-destructive bg-background focus:ring-destructive'
										: 'border-input bg-background focus:ring-ring'
								}`}
								placeholder='Enter your email address'
								value={formData.email}
								onChange={handleChange}
							/>
							{errors.email && (
								<p className='mt-1 text-sm text-destructive'>{errors.email}</p>
							)}
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
								className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 ${
									errors.password
										? 'border-destructive bg-background focus:ring-destructive'
										: 'border-input bg-background focus:ring-ring'
								}`}
								placeholder='Create a password (min 6 characters)'
								value={formData.password}
								onChange={handleChange}
							/>
							{errors.password && (
								<p className='mt-1 text-sm text-destructive'>{errors.password}</p>
							)}
						</div>

						<div>
							<label htmlFor='confirmPassword' className='block text-sm font-medium text-foreground'>
								Confirm Password
							</label>
							<input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								required
								className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 ${
									errors.confirmPassword
										? 'border-destructive bg-background focus:ring-destructive'
										: 'border-input bg-background focus:ring-ring'
								}`}
								placeholder='Confirm your password'
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
							{errors.confirmPassword && (
								<p className='mt-1 text-sm text-destructive'>{errors.confirmPassword}</p>
							)}
						</div>
					</div>

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{isLoading ? 'Creating account...' : 'Create account'}
						</button>
					</div>

					<div className='text-center'>
						<p className='text-sm text-muted-foreground'>
							Already have an account?{' '}
							<Link
								to='/login'
								className='font-medium text-primary hover:text-primary/90 transition-colors'
							>
								Sign in here
							</Link>
						</p>
					</div>
				</form>

				<div className='text-center'>
					<p className='text-xs text-muted-foreground'>
						By creating an account, you agree to our{' '}
						<a href='#' className='text-primary hover:text-primary/90'>
							Terms of Service
						</a>{' '}
						and{' '}
						<a href='#' className='text-primary hover:text-primary/90'>
							Privacy Policy
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
