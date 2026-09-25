import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devadmin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth session on boot
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          if (profile && profile.is_superuser) {
            const userData = {
              id: profile.id,
              username: profile.username,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
              email: profile.email || `${profile.username}@devadmin.io`,
              role: 'Super Administrator',
              is_superuser: true,
              is_staff: profile.is_staff,
              avatar: null
            };
            setUser(userData);
            localStorage.setItem('devadmin_user', JSON.stringify(userData));
          } else {
            // Not a superuser or invalid profile
            logout();
          }
        } catch {
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(username, password);
      if (res && res.access) {
        localStorage.setItem('access_token', res.access);
        if (res.refresh) localStorage.setItem('refresh_token', res.refresh);
        setToken(res.access);
        setRefreshToken(res.refresh || null);

        // Fetch user profile from /auth/me/ to verify superuser privileges
        const profile = await authApi.getMe();
        if (!profile || !profile.is_superuser) {
          logout();
          throw new Error('Access denied. Only Superadministrators are authorized to access DevAdmin.');
        }

        const newUser = {
          id: profile.id,
          username: profile.username,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
          email: profile.email || `${profile.username}@devadmin.io`,
          role: 'Super Administrator',
          is_superuser: true,
          is_staff: profile.is_staff,
          avatar: null
        };

        setUser(newUser);
        localStorage.setItem('devadmin_user', JSON.stringify(newUser));
        setIsAuthModalOpen(false);
        return { success: true, user: newUser };
      } else {
        throw new Error('Invalid authentication response from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(userData);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      if (res && res.access) {
        localStorage.setItem('access_token', res.access);
        if (res.refresh) localStorage.setItem('refresh_token', res.refresh);
        setToken(res.access);
        setRefreshToken(res.refresh || null);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('devadmin_user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user && user.is_superuser === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

