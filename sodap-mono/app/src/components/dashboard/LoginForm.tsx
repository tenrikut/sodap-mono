
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

type LoginFormProps = {
  selectedRole: string;
  onBack: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ selectedRole, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password'>('email');

  // Get test credentials based on selected role
  const getTestCredentials = () => {
    switch(selectedRole) {
      case 'platform_admin':
        return { email: 'admin@sodap.com', password: 'password123' };
      case 'store_manager':
        return { email: 'manager@sodap.com', password: 'password123' };
      case 'store_staff':
        return { email: 'staff@sodap.com', password: 'password123' };
      default:
        return { email: '', password: '' };
    }
  };
  
  const testCredentials = getTestCredentials();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginStep === 'email') {
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return;
      }
      setLoginStep('password');
    } else {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Extract username from email for display purposes
    const username = email.split('@')[0];
    
    // Store username in sessionStorage
    sessionStorage.setItem('username', username);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login successful",
        description: "You have been logged in.",
      });
      
      // Navigate based on selected role
      switch(selectedRole) {
        case 'platform_admin':
          navigate('/dashboard/admin');
          break;
        case 'store_manager':
          navigate('/dashboard/manager');
          break;
        case 'store_staff':
          navigate('/dashboard/staff');
          break;
        default:
          navigate('/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-900"
          >
            Back
          </Button>
        </div>
        <CardHeader className="space-y-1 flex flex-col items-center pt-10">
          <div className="w-16 h-16 rounded-full bg-gradient-sodap mb-4"></div>
          <CardTitle className="text-2xl font-bold">
            {selectedRole === 'platform_admin' ? 'Platform Admin Login' : 
            selectedRole === 'store_manager' ? 'Store Manager Login' : 
            selectedRole === 'store_staff' ? 'Store Staff Login' : 'Login'}
          </CardTitle>
          {loginStep === 'email' && (
            <p className="text-gray-500 text-sm mt-1">Enter your email to continue</p>
          )}
          {loginStep === 'password' && (
            <div className="text-center">
              <p className="text-gray-900 font-medium">{email}</p>
              <p className="text-gray-500 text-sm mt-1">Enter your password</p>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleContinue} className="space-y-4">
            {loginStep === 'email' && (
              <div className="space-y-2">
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                  autoFocus
                />
                
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2 text-sm">
                  <p className="font-medium text-gray-700 mb-1">Test Credentials:</p>
                  <p className="text-gray-600">Email: <span className="font-mono">{testCredentials.email}</span></p>
                  <p className="text-gray-500 text-xs mt-1">(Click to auto-fill)</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEmail(testCredentials.email)}
                    className="w-full mt-2 h-8 text-xs bg-gray-100 hover:bg-gray-200"
                  >
                    Use Test Email
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-sodap-purple hover:bg-sodap-purple/90 text-white h-12 flex items-center justify-center"
                >
                  Continue <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
            
            {loginStep === 'password' && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12"
                    required
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2 text-sm">
                  <p className="font-medium text-gray-700 mb-1">Test Credentials:</p>
                  <p className="text-gray-600">Password: <span className="font-mono">{testCredentials.password}</span></p>
                  <p className="text-gray-500 text-xs mt-1">(Click to auto-fill)</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setPassword(testCredentials.password)}
                    className="w-full mt-2 h-8 text-xs bg-gray-100 hover:bg-gray-200"
                  >
                    Use Test Password
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-sodap-purple hover:bg-sodap-purple/90 text-white h-12"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            )}
          </form>
          
          <div className="mt-4 text-center text-sm">
            <Button 
              variant="ghost"
              className="text-sodap-blue hover:underline"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
