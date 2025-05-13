
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import DashboardView from '@/components/dashboard/DashboardView';
import RoleSelection from '@/components/dashboard/RoleSelection';
import LoginForm from '@/components/dashboard/LoginForm';

type DashboardProps = {
  role?: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
};

const Dashboard: React.FC<DashboardProps> = ({ role = 'end_user' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isUserLoggedIn = sessionStorage.getItem('username') !== null;
  
  // State for role selection flow
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Determine the actual role based on the current path
  const determineRole = (): 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user' => {
    if (currentPath.includes('/admin')) return 'platform_admin';
    if (currentPath.includes('/manager')) return 'store_manager';
    if (currentPath.includes('/staff')) return 'store_staff';
    return role;
  };
  
  const actualRole = determineRole();
  
  // Role selection handler
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };
  
  // If user is already assigned a role, show their dashboard
  if (role !== 'end_user' || (currentPath !== '/dashboard' && isUserLoggedIn)) {
    return (
      <Layout role={actualRole}>
        <DashboardView role={actualRole} />
      </Layout>
    );
  }
  
  // Render login form if role is selected
  if (selectedRole) {
    return <LoginForm selectedRole={selectedRole} onBack={() => setSelectedRole(null)} />;
  }
  
  // Landing page with role selection
  return <RoleSelection onRoleSelect={handleRoleSelect} />;
};

export default Dashboard;
