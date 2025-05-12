"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is done loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      // Redirect to login page
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while loading or redirecting
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If authenticated, show the protected content
  return <>{children}</>;
}
