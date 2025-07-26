import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
	const { isAuthenticated, isLoading } = useAuth();

	// Show loading or spinner while checking authentication
	if (isLoading) {
		return <div className='flex h-screen items-center justify-center'>Loading...</div>;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	// Render the protected content
	return <Outlet />;
};

export default ProtectedRoute;
