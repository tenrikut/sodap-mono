import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/ui/back-button";
import { ArrowRight } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return;
      }
      setStep("password");
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
    const username = email.split("@")[0];

    // Store username in sessionStorage
    sessionStorage.setItem("username", username);

    // Check for test credentials
    const isTestUser = email === "test@sodap.io" && password === "sodap123";

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);

      // Accept test credentials or any credentials for demo
      toast({
        title: "Login successful",
        description: "You have been logged in.",
      });

      // Navigate to the store selection page after successful login
      navigate("/store-selection");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="absolute top-4 left-4">
          {step === "password" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("email")}
              className="text-gray-500 hover:text-gray-900"
            >
              Back
            </Button>
          ) : (
            <BackButton />
          )}
        </div>
        <CardHeader className="space-y-1 flex flex-col items-center pt-10">
          <div className="w-16 h-16 rounded-full bg-gradient-sodap mb-4"></div>
          <CardTitle className="text-2xl font-bold">Sign in to SoDap</CardTitle>
          {step === "email" && (
            <p className="text-gray-500 text-sm mt-1">
              Enter your email to continue
            </p>
          )}
          {step === "password" && (
            <div className="text-center">
              <p className="text-gray-900 font-medium">{email}</p>
              <p className="text-gray-500 text-sm mt-1">Enter your password</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleContinue} className="space-y-4">
            {step === "email" && (
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

                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  <p className="font-medium text-gray-700 mb-1">
                    Test User Credentials:
                  </p>
                  <p className="text-gray-600">
                    Email: <span className="font-mono">test@sodap.io</span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmail("test@sodap.io")}
                    className="w-full mt-1 h-7 text-xs bg-gray-100 hover:bg-gray-200"
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

            {step === "password" && (
              <div className="space-y-2">
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                  autoFocus
                />

                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  <p className="font-medium text-gray-700 mb-1">
                    Test User Credentials:
                  </p>
                  <p className="text-gray-600">
                    Password: <span className="font-mono">sodap123</span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPassword("sodap123")}
                    className="w-full mt-1 h-7 text-xs bg-gray-100 hover:bg-gray-200"
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
            <Link
              to="/forgot-password"
              className="text-sodap-blue hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/signup"
              className="text-sodap-purple hover:underline font-medium"
            >
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
