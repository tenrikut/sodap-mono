
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import BackButton from '@/components/ui/back-button';
import { ProfileProvider } from '@/contexts/ProfileContext';

// Import tab components
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import RewardsTab from '@/components/profile/RewardsTab';
import WalletTab from '@/components/profile/WalletTab';
import PurchasesTab from '@/components/profile/PurchasesTab';
import ReturnsTab from '@/components/profile/ReturnsTab';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("info");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
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
  }, []);

  return (
    <Layout>
      <ProfileProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BackButton />
              <h1 className="text-3xl font-bold">My Profile</h1>
            </div>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="rewards">Earn Rewards</TabsTrigger>
              <TabsTrigger value="wallet">My Wallet</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
              <TabsTrigger value="returns">Return Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <ProfileInfoTab />
            </TabsContent>
            
            <TabsContent value="rewards">
              <RewardsTab />
            </TabsContent>
            
            <TabsContent value="wallet">
              <WalletTab />
            </TabsContent>
            
            <TabsContent value="purchases">
              <PurchasesTab />
            </TabsContent>
            
            <TabsContent value="returns">
              <ReturnsTab />
            </TabsContent>
          </Tabs>
        </div>
      </ProfileProvider>
    </Layout>
  );
};

export default Profile;
