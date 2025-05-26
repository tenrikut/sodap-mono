
import React from 'react';
import { useLocation } from 'react-router-dom';
import PlatformAdminDashboard from '@/components/dashboard/PlatformAdminDashboard';
import StoreManagerDashboard from '@/components/dashboard/StoreManagerDashboard';
import DefaultDashboard from '@/components/dashboard/DefaultDashboard';
import SettingsPage from '@/components/dashboard/SettingsPage';
import AdminInfoTab from '@/components/dashboard/AdminInfoTab';

type DashboardViewProps = {
  role: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
};

const DashboardView: React.FC<DashboardViewProps> = ({ role }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Check if we're on the settings page
  if (currentPath === '/dashboard/settings') {
    return <SettingsPage />;
  }
  
  // Check if we're on the admin info page
  if (currentPath === '/dashboard/admin-info') {
    return <AdminInfoTab role={role} />;
  }
  
  // Check if we're on the refunds page
  if (currentPath === '/dashboard/refunds') {
    // We'll render the StoreManagerDashboard with refunds tab selected
    return <StoreManagerDashboard initialTab="refunds" />;
  }
  
  // Check if we're on the products page
  if (currentPath === '/dashboard/products') {
    // Render the StoreManagerDashboard with products tab selected and customized tab title
    return <StoreManagerDashboard initialTab="products" customTabTitle="Product Management" />;
  }
  
  // Render appropriate dashboard based on role
  if (role === 'platform_admin') {
    return <PlatformAdminDashboard />;
  }
  
  if (role === 'store_manager') {
    return <StoreManagerDashboard />;
  }
  
  // Render default dashboard for store staff and end users
  return <DefaultDashboard role={role} />;
};

export default DashboardView;
