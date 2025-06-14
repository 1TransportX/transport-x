
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Truck, 
  Package, 
  Settings, 
  User,
  LogOut,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavigationItems = () => {
    if (!profile) return [];

    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'employee', 'driver'] }
    ];

    if (profile.role === 'admin') {
      items.push(
        { path: '/employees', label: 'Employees', icon: Users, roles: ['admin'] },
        { path: '/fleet', label: 'Fleet', icon: Truck, roles: ['admin'] },
        { path: '/warehouse', label: 'Warehouse', icon: Package, roles: ['admin'] },
        { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
        { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] }
      );
    } else if (profile.role === 'employee') {
      items.push(
        { path: '/warehouse', label: 'Warehouse', icon: Package, roles: ['employee'] },
        { path: '/profile', label: 'Profile', icon: User, roles: ['employee'] }
      );
    } else if (profile.role === 'driver') {
      items.push(
        { path: '/fleet', label: 'Fleet', icon: Truck, roles: ['driver'] },
        { path: '/profile', label: 'Profile', icon: User, roles: ['driver'] }
      );
    }

    return items.filter(item => item.roles.includes(profile.role));
  };

  const navigationItems = getNavigationItems();

  console.log('=== Navigation - profile role:', profile?.role);
  console.log('=== Navigation - items:', navigationItems);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">OpsManager</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="text-sm text-gray-600">
                Welcome, {profile.first_name || profile.email}
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {profile.role}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
