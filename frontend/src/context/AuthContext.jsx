import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    // Check if we are running in mock auth mode
    const isMockMode = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || 
                       !import.meta.env.VITE_SUPABASE_URL;
    setIsMock(isMockMode);

    if (isMockMode) {
      // Load mock session from localStorage if exists
      const savedMockUser = localStorage.getItem('mock_user');
      if (savedMockUser) {
        const u = JSON.parse(savedMockUser);
        setUser(u);
        setSession({ access_token: 'dev-mock-token', user: u });
      }
      setLoading(false);
      return;
    }

    // Real Supabase Auth listeners
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (isMock) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email,
        user_metadata: { full_name: email.split('@')[0].toUpperCase() },
      };
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setSession({ access_token: 'dev-mock-token', user: mockUser });
      return { data: { user: mockUser, session }, error: null };
    }

    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, fullName) => {
    if (isMock) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email,
        user_metadata: { full_name: fullName || email.split('@')[0].toUpperCase() },
      };
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setSession({ access_token: 'dev-mock-token', user: mockUser });
      return { data: { user: mockUser, session }, error: null };
    }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  };

  const logout = async () => {
    if (isMock) {
      localStorage.removeItem('mock_user');
      setUser(null);
      setSession(null);
      return { error: null };
    }

    return supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isMock,
    login,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
