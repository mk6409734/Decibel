
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  BarChart3, 
  Edit, 
  Wrench, 
  HelpCircle, 
  List, 
  MapPin,
  Bell,
  Settings,
  Shield
} from 'lucide-react';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-sidebar h-screen flex flex-col border-r border-industrial-steel/30">
      <div className="p-4 border-b border-industrial-steel/30">
        <Logo />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">Main Menu</div>
        <div className="space-y-1 px-2">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <List className="mr-3 h-5 w-5" />
            All Sirens
          </NavLink>
          
          <NavLink 
            to="/map" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <MapPin className="mr-3 h-5 w-5" />
            Map View
          </NavLink>
          
          <NavLink 
            to="/cap-map" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <Shield className="mr-3 h-5 w-5" />
            Disaster Alerts
          </NavLink>
        </div>
        
        <div className="mt-8 px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">Main Navigation</div>
        <div className="space-y-1 px-2">
          <NavLink 
            to="/file" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <FileText className="mr-3 h-5 w-5" />
            File
          </NavLink>
          
          <NavLink 
            to="/reports" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <BarChart3 className="mr-3 h-5 w-5" />
            Reports
          </NavLink>
          
          <NavLink 
            to="/edit" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <Edit className="mr-3 h-5 w-5" />
            Edit
          </NavLink>
          
          <NavLink 
            to="/tools" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <Wrench className="mr-3 h-5 w-5" />
            Tools
          </NavLink>
          
          <NavLink 
            to="/help" 
            className={({ isActive }) => 
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-industrial-steel/30 text-white' 
                  : 'text-gray-300 hover:bg-industrial-steel/20 hover:text-white'
              }`
            }
          >
            <HelpCircle className="mr-3 h-5 w-5" />
            Help
          </NavLink>
        </div>
      </nav>
      
      <div className="p-4 border-t border-industrial-steel/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">System Status: Online</div>
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
