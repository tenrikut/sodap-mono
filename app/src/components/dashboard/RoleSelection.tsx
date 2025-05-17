
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';

type RoleSelectionProps = {
  onRoleSelect: (role: string) => void;
};

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-sodap mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to SoDap</h1>
          <p className="text-gray-500 mt-2">Select your dashboard to continue</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="space-y-4">
            <Button 
              onClick={() => onRoleSelect('platform_admin')} 
              className="w-full h-14 text-lg bg-sodap-purple hover:bg-sodap-purple/90 flex items-center justify-center"
            >
              Platform Admin
            </Button>
            
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="w-full h-14 text-lg bg-sodap-blue hover:bg-sodap-blue/90 flex items-center justify-between px-6"
                  >
                    <span>Store Admin</span>
                    <ChevronDown size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[16rem] bg-white">
                  <DropdownMenuItem onClick={() => onRoleSelect('store_manager')}>
                    Store Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRoleSelect('store_staff')}>
                    Store Staff
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button 
              onClick={() => navigate('/login')} 
              variant="outline" 
              className="w-full h-12 border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5 mt-2"
            >
              Login as User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
