import React from 'react';
import { DataProvider } from './context/DataContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';

function App() {
	return (
		<Router>
			<AuthProvider>
				<DataProvider>
					<AppRoutes />
				</DataProvider>
			</AuthProvider>
		</Router>
	);
}

export default App;
