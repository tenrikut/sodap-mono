import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Wallet, Settings, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAnchor } from '@/hooks/useAnchor';
import { ProfileProvider } from '@/contexts/ProfileContext';

// Import tab components
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import WalletTab from '@/components/profile/WalletTab';

interface AdminInfoTabProps {
  role: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
}

const AdminInfoTab: React.FC<AdminInfoTabProps> = ({ role }) => {
  const { walletAddress, isConnected } = useAnchor();
  const [activeTab, setActiveTab] = useState('info');
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Define valid tabs for admin info
  const validTabs = ['info', 'wallet', 'security'];

  useEffect(() => {
    setIsLoading(true);
    // Fetch user info from session storage
    const storedUsername = sessionStorage.getItem("username");
    const storedRole = sessionStorage.getItem("userRole");

    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (storedRole) {
      setUserRole(storedRole);
    } else {
      // If no stored role, use the role prop
      setUserRole(role);
    }
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [role]);
  
  // Get icon for each tab
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'info':
        return <User className="mr-2" size={16} />;
      case 'wallet':
        return <Wallet className="mr-2" size={16} />;
      case 'security':
        return <Shield className="mr-2" size={16} />;
      default:
        return null;
    }
  };

  // Get display name for role
  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'platform_admin':
        return 'Platform Administrator';
      case 'store_manager':
        return 'Store Manager';
      case 'store_staff':
        return 'Store Staff';
      default:
        return 'User';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ProfileProvider>
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4 border-2 border-sodap-purple">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} />
              <AvatarFallback>{username?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{username || 'Admin'}</h1>
              <p className="text-gray-500">{getRoleDisplayName()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" size="sm">
                <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                Wallet Connected
              </Button>
            ) : (
              <Button className="bg-sodap-purple hover:bg-purple-700" size="sm">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
        
        <Separator />

        {/* Tabs with improved styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
            {validTabs.map(tab => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className={`flex items-center ${activeTab === tab ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} rounded-md transition-all duration-200 px-4 py-2`}
              >
                {getTabIcon(tab)}
                {tab === 'info' ? 'Admin Info' : 
                 tab === 'wallet' ? 'Wallet' : 
                 'Security'}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <TabsContent value="info" className="mt-0">
                <ProfileInfoTab isAdmin={true} />
              </TabsContent>
              
              <TabsContent value="wallet" className="mt-0">
                <WalletTab isAdmin={true} />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                  <p className="text-gray-500">Manage your account security settings and permissions.</p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Admin Access Level
                    </h3>
                    <p className="text-sm">
                      As a {getRoleDisplayName()}, you have elevated permissions in the system.
                      Please ensure you follow security best practices.
                    </p>
                  </div>
                  
                  <div className="grid gap-4 mt-4">
                    <Button variant="outline" className="justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Shield className="mr-2 h-4 w-4" />
                      Two-Factor Authentication
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </ProfileProvider>
  );
};

export default AdminInfoTab;
