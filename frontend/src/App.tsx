import React from 'react';
import { DataProvider } from './context/DataContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import { Toaster} from 'sonner'

function App() {
	return (
		<Router>
			<AuthProvider>
				<DataProvider>
				<Toaster position="top-right" richColors/>
					<AppRoutes />
				</DataProvider>
			</AuthProvider>
		</Router>
	);
}

export default App;
