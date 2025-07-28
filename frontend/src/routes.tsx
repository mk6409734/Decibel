import { Routes, Route } from 'react-router-dom';
import { FileText, BarChart3, Edit, Wrench, HelpCircle } from 'lucide-react';
import Index from './pages/Index';
import MapPage from './pages/MapPage';
import CAPMapPage from './pages/CAPMapPage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFound from './pages/NotFound';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import FileDownloadPage from './pages/fileDownloadPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    {/* Protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/cap-map" element={<CAPMapPage />} />
        <Route
          path="/file"
          element={
            <FileDownloadPage
              title="Download Alerts log Files"
              icon={<FileText className="h-8 w-8" />}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <PlaceholderPage
              title="Reports"
              icon={<BarChart3 className="h-8 w-8" />}
            />
          }
        />
        <Route
          path="/edit"
          element={
            <PlaceholderPage title="Edit" icon={<Edit className="h-8 w-8" />} />
          }
        />
        <Route
          path="/tools"
          element={
            <PlaceholderPage
              title="Tools"
              icon={<Wrench className="h-8 w-8" />}
            />
          }
        />
        <Route
          path="/help"
          element={
            <PlaceholderPage
              title="Help"
              icon={<HelpCircle className="h-8 w-8" />}
            />
          }
        />
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
