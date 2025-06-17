
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  BarChart3, 
  Users, 
  Route, 
  Settings, 
  User,
  LogOut,
  FileText,
  Menu,
  Truck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const getNavigationItems = () => {
    if (!profile) return [];

    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'driver'] }
    ];

    if (profile.role === 'admin') {
      items.push(
        { path: '/employees', label: 'Drivers', icon: Users, roles: ['admin'] },
        { path: '/routes', label: 'Routes', icon: Route, roles: ['admin'] },
        { path: '/fleet', label: 'Fleet', icon: Truck, roles: ['admin'] },
        { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
        { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] }
      );
    } else if (profile.role === 'driver') {
      items.push(
        { path: '/routes', label: 'Routes', icon: Route, roles: ['driver'] },
        { path: '/fleet', label: 'Fleet', icon: Truck, roles: ['driver'] },
        { path: '/profile', label: 'Profile', icon: User, roles: ['driver'] }
      );
    }

    return items.filter(item => item.roles.includes(profile.role));
  };

  const navigationItems = getNavigationItems();

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 p-0">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-white">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b">
            <SheetTitle asChild>
              <Link to="/dashboard" className="flex items-center space-x-2" onClick={handleNavClick}>
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">ETW Manager</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-auto">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t mt-auto bg-gray-50">
            {profile && (
              <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-900">
                  {profile.first_name || profile.email}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Role: {profile.role}
                </div>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 bg-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
