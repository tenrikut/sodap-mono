"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User as AuthUser,
  Session,
  SupabaseClient,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Simplified AuthContextType for demo purposes
interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: any | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Only create Supabase client if credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Create a dummy supabase client for demo purposes if no credentials
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    // Continue without Supabase
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("sodap_auth") === "true";
      const storedUser = localStorage.getItem("sodap_user");

      if (isLoggedIn && storedUser) {
        setIsAuthenticated(false);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // Invalid stored user
          localStorage.removeItem("sodap_user");
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Also listen for Supabase auth changes if using Supabase
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsAuthenticated(!!session?.user);
          setLoading(false);
        }
      );

      return () => {
        listener?.subscription.unsubscribe();
      };
    }
  }, []);

  // Demo login function
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Demo authentication logic
      if (
        (username === "sodap" && password === "sodap") ||
        (username === "tamkin" && password === "test1234")
      ) {
        // Create a mock user
        const mockUser = {
          id: username === "sodap" ? "sodap-user-id" : "tamkin-user-id",
          email:
            username === "sodap" ? "sodap@example.com" : "miladili@outlook.de",
          user_metadata: {
            username,
            wallet:
              username === "tamkin"
                ? "9yg11hJpMpreQmqtCoVxR55DgbJ248wiT4WuQhksEz2J"
                : null,
          },
        };

        // Store auth state in localStorage
        localStorage.setItem("sodap_auth", "true");
        localStorage.setItem("sodap_user", JSON.stringify(mockUser));

        setUser(mockUser as any);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      }

      // Try Supabase login if credentials don't match demo users and Supabase is available
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username.includes("@") ? username : `${username}@example.com`,
          password,
        });

        if (error) {
          throw error;
        }

        return !!data.user;
      }

      setError("Invalid credentials");
      return false;
    } catch (err) {
      setError(err);
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("sodap_auth");
    localStorage.removeItem("sodap_user");

    // Clear state
    setUser(null);
    setIsAuthenticated(false);

    // Also sign out from Supabase if using it
    if (supabase) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
