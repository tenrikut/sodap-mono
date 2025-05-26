
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import BackButton from '@/components/ui/back-button';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { useAnchor } from '@/hooks/useAnchor';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Wallet, ShoppingBag, RefreshCw, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

// Import tab components
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import WalletTab from '@/components/profile/WalletTab';
import PurchasesTab from '@/components/profile/PurchasesTab';
import ReturnsTab from '@/components/profile/ReturnsTab';

const Profile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress, isConnected } = useAnchor();
  
  // Get tab from URL query parameter or default to "info"
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const validTabs = ['info', 'wallet', 'purchases', 'returns'];
  const defaultTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'info';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Update URL when tab changes
  useEffect(() => {
    // Update the URL without refreshing the page
    navigate(`/profile?tab=${activeTab}`, { replace: true });
  }, [activeTab, navigate]);
  
  // Update active tab when URL changes
  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    setIsLoading(true);
    // Fetch user info from session storage (would be API in production)
    const storedUsername = sessionStorage.getItem("username");
    const storedRole = sessionStorage.getItem("userRole");

    if (storedUsername) {
      setUsername(storedUsername);
      
      // Special case for Batur - set up his wallet address
      if (storedUsername === "Batur") {
        // Save Batur's wallet address in session storage
        sessionStorage.setItem("userWallet", "DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW");
        console.log("Set up Batur's wallet address: DfhzrfdE5VDk43iP1NL8MLS5xFaxquxJVFtjhjRmHLAW");
      }
    }

    if (storedRole) {
      setRole(storedRole);
    }
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Get icon for each tab
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'info':
        return <User className="mr-2" size={16} />;
      case 'wallet':
        return <Wallet className="mr-2" size={16} />;
      case 'purchases':
        return <ShoppingBag className="mr-2" size={16} />;
      case 'returns':
        return <RefreshCw className="mr-2" size={16} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProfileProvider>
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <BackButton />
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4 border-2 border-sodap-purple">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt={username} />
                  <AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{username}'s Profile</h1>
                  <p className="text-gray-500">{role || 'User'}</p>
                </div>
              </div>
            </div>
            

          </div>
          
          <Separator className="mb-8" />

          {/* Tabs with improved styling */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-8 bg-gray-100 p-1 rounded-lg">
              {validTabs.map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className={`flex items-center ${activeTab === tab ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} rounded-md transition-all duration-200 px-4 py-2`}
                >
                  {getTabIcon(tab)}
                  {tab === 'info' ? 'Profile Info' : 
                   tab === 'wallet' ? 'My Wallet' : 
                   tab === 'purchases' ? 'Purchase History' : 
                   'Return Requests'}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <TabsContent value="info" className="mt-0">
                  <ProfileInfoTab />
                </TabsContent>
                
                <TabsContent value="wallet" className="mt-0">
                  <WalletTab />
                </TabsContent>
                
                <TabsContent value="purchases" className="mt-0">
                  <PurchasesTab />
                </TabsContent>
                
                <TabsContent value="returns" className="mt-0">
                  <ReturnsTab />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </ProfileProvider>
    </Layout>
  );
};

export default Profile;
