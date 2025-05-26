import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the user type
type User = {
  email: string;
  name?: string;
};

// Define the session type (similar to NextAuth's session)
type Session = {
  user: User;
};

// Define the auth context type
type AuthContextType = {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
};

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  data: null,
  status: 'loading',
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth provider
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    // Simulate loading the session
    const loadSession = async () => {
      try {
        // For demo purposes, we'll create a mock session
        // In a real app, you would check localStorage, cookies, or an API
        const mockUser = {
          email: 'manager@sodap.com',
          name: 'Store Manager',
        };

        // Set the session after a brief delay to simulate loading
        setTimeout(() => {
          setSession({ user: mockUser });
          setStatus('authenticated');
        }, 500);
      } catch (error) {
        console.error('Failed to load session:', error);
        setStatus('unauthenticated');
      }
    };

    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ data: session, status }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useSession = () => useContext(AuthContext);
