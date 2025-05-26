
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/contexts/ProfileContext';

interface ProfileInfoTabProps {
  isAdmin?: boolean;
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({ isAdmin = false }) => {
  const { userProfile, walletAddress } = useProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
            <p className="mt-1">{userProfile.fullName}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1">{userProfile.email}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Status</h3>
          <div className="flex items-center">
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-500">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-red-500">Not Connected</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfoTab;
