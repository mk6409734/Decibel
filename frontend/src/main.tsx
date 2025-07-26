import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAuth } from './services/auth';

// Initialize auth token from localStorage
initAuth();

createRoot(document.getElementById('root')!).render(<App />);
