
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If this email exists, a reset link has been sent.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <BackButton />
        </div>
        <CardHeader className="space-y-1 flex flex-col items-center pt-10">
          <div className="w-12 h-12 rounded-full bg-gradient-sodap mb-4"></div>
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-sodap-purple hover:bg-sodap-purple/90 text-white h-12"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-600">
                If an account exists with this email, you will receive a reset link shortly.
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-sodap-blue hover:underline">
              Return to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
