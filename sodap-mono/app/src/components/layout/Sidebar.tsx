
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  User, 
  Store, 
  FileText, 
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCcw
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type SidebarLink = {
  name: string;
  icon: React.ReactNode;
  href: string;
  onClick?: () => void;
};

type SidebarProps = {
  role?: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
};

const Sidebar: React.FC<SidebarProps> = ({ role = 'end_user' }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if we're on any dashboard-related page
  const isDashboardPage = location.pathname.includes('/dashboard');

  // Handle logout action
  const handleLogout = () => {
    // Clear any user data from sessionStorage
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userWallet');
    
    // Show toast notification
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    
    // Check if we're on the manager dashboard and redirect to /dashboard
    if (location.pathname === '/dashboard/manager') {
      navigate('/dashboard', { replace: true });
    } else {
      // For other pages, navigate to landing page
      navigate('/landing', { replace: true });
    }
  };

  const getLinksByRole = (): SidebarLink[] => {
    // If we're on a dashboard page, determine links based on role
    if (isDashboardPage) {
      // Create base links for each role
      let roleLinks: SidebarLink[] = [];
      
      switch (role) {
        case 'platform_admin':
          roleLinks = [
            { name: 'Dashboard', icon: <Home size={18} />, href: '/dashboard/admin' },
            { name: 'Admin Info', icon: <User size={18} />, href: '/dashboard/admin-info' },
            { name: 'Platform Admins', icon: <Users size={18} />, href: '/dashboard/admins' },
            { name: 'Store Managers', icon: <Users size={18} />, href: '/dashboard/managers' },
            { name: 'All Stores', icon: <Store size={18} />, href: '/dashboard/stores' },
            { name: 'Analytics', icon: <FileText size={18} />, href: '/dashboard/analytics' },
          ];
          break;
        case 'store_manager':
          roleLinks = [
            { name: 'Dashboard', icon: <Home size={18} />, href: '/dashboard/manager' },
            { name: 'Settings', icon: <User size={18} />, href: '/dashboard/settings' },
          ];
          break;
        case 'store_staff':
          roleLinks = [
            { name: 'Dashboard', icon: <Home size={18} />, href: '/dashboard/staff' },
            { name: 'Products', icon: <FileText size={18} />, href: '/dashboard/products' },
            { name: 'Refunds', icon: <RefreshCcw size={18} />, href: '/dashboard/refunds' },
          ];
          break;
        default:
          // Default links for end users on dashboard pages
          roleLinks = [
            { name: 'Dashboard', icon: <Home size={18} />, href: '/dashboard' },
            { name: 'Login', icon: <LogIn size={18} />, href: '/login' },
          ];
          break;
      }
      
      // Add logout link for authenticated users (all roles except default end user)
      if (role !== 'end_user' || sessionStorage.getItem('username')) {
        roleLinks.push({
          name: 'Logout',
          icon: <LogOut size={18} />,
          href: '#',
          onClick: handleLogout
        });
      }
      
      return roleLinks;
    } else {
      // Non-dashboard pages: show regular user menu based on authentication status
      const isAuthenticated = !!sessionStorage.getItem('username');
      
      if (isAuthenticated) {
        return [
          { name: 'Home', icon: <Home size={18} />, href: '/store-selection' },
          { name: 'Shop', icon: <Store size={18} />, href: '/shop' },
          { name: 'Profile', icon: <User size={18} />, href: '/profile' },
          { name: 'Purchase History', icon: <FileText size={18} />, href: '/profile?tab=purchases' },
          { name: 'Cart', icon: <ShoppingCart size={18} />, href: '/cart' },
          { 
            name: 'Logout', 
            icon: <LogOut size={18} />, 
            href: '#', 
            onClick: handleLogout 
          },
        ];
      } else {
        return [
          { name: 'Home', icon: <Home size={18} />, href: '/store-selection' },
          { name: 'Shop', icon: <Store size={18} />, href: '/shop' },
          { name: 'Cart', icon: <ShoppingCart size={18} />, href: '/cart' },
          { name: 'Login', icon: <LogIn size={18} />, href: '/login' },
        ];
      }
    }
  };

  const links = getLinksByRole();

  return (
    <div 
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-sidebar transition-all duration-300 h-screen border-r relative`}
    >
      <button 
        className="absolute -right-3 top-16 bg-white border rounded-full p-1 shadow-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <div className="p-4">
        {!collapsed && (
          <div className="text-lg font-semibold text-sodap-purple mb-8">
            {role === 'platform_admin' && 'Platform Admin'}
            {role === 'store_manager' && 'Store Manager'}
            {role === 'store_staff' && 'Store Staff'}
            {role === 'end_user' && (isDashboardPage ? 'Admin Menu' : 'SoDap Menu')}
          </div>
        )}

        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={link.onClick}
              className={`flex items-center p-3 rounded-md hover:bg-accent text-gray-600 hover:text-sodap-purple transition-colors ${
                location.pathname === link.href ? 'bg-accent text-sodap-purple' : ''
              }`}
            >
              <span>{link.icon}</span>
              {!collapsed && <span className="ml-3">{link.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
