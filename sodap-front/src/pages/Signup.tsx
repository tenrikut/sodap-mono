
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from 'lucide-react';

const Signup: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [walletAddress, setWalletAddress] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Store username in sessionStorage for later use
      sessionStorage.setItem('username', username);
      
      // Store wallet address in sessionStorage
      if (walletAddress) {
        sessionStorage.setItem('walletAddress', walletAddress);
      }
      
      toast({
        title: "Account created",
        description: "Your SoDap account has been created successfully.",
      });
      // Redirect would happen here
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-sodap mb-4"></div>
          <CardTitle className="text-2xl font-bold">Create your SoDap account</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="username"
                placeholder="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="email"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="password"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="confirmPassword"
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Wallet size={18} />
              </div>
              <Input
                id="walletAddress"
                placeholder="Wallet Address (Optional)"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="h-12 pl-10"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-sodap-blue hover:bg-sodap-blue/90 text-white h-12"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-sodap-purple hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
