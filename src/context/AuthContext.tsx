import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT decoder to avoid adding 'jwt-decode' dependency just for this
function parseJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    
    // Map JWT claims to User object
    // Note: Backend claims use snake_case keys in JSON marshalling usually, 
    // but let's check auth.go: 
    // UserID int `json:"user_id"`
    // Email string `json:"email"`
    // Name string `json:"name"`
    // AvatarURL string `json:"avatar_url"`
    
    return {
      id: decoded.user_id,
      email: decoded.email,
      name: decoded.name,
      avatar_url: decoded.avatar_url
    };
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      const decodedUser = parseJwt(storedToken);
      if (decodedUser) {
        setUser(decodedUser);
        setToken(storedToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    const decodedUser = parseJwt(newToken);
    setToken(newToken);
    setUser(decodedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }), [user, token, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}