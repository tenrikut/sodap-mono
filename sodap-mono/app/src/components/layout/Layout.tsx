
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from '@/components/landing/Footer';
import { useLocation } from 'react-router-dom';

type LayoutProps = {
  children: React.ReactNode;
  hideNav?: boolean;
  role?: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
};

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false, role = 'end_user' }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Don't show sidebar on landing page, login, or signup
  const hideSidebar = isLandingPage || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header role={role} />
      
      <div className="flex flex-1">
        {!hideSidebar && !hideNav && (
          <Sidebar role={role} />
        )}
        
        <main className={`flex-1 p-6 overflow-y-auto ${hideSidebar ? '' : ''}`}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;
