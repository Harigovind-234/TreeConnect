import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = authService.getCurrentUser();
      const token = authService.getToken();
      return (storedUser && token) ? storedUser : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getCurrentUser();
      const token = authService.getToken();
      if (storedUser && token) {
        // Normalize name with contactPerson if available
        if (storedUser.email === 'arunbuyer@gmail.com' || storedUser.name === 'timberbuyers') {
          storedUser.name = storedUser.contactPerson || 'Arun K';
          storedUser.fullName = 'Arun K';
          storedUser.contactPerson = 'Arun K';
          storedUser.companyName = 'timberbuyers';
        } else if (storedUser.contactPerson && !storedUser.name) {
          storedUser.name = storedUser.contactPerson;
        }
        setUser(storedUser);

        // Fetch fresh profile from API to ensure approved documents and registered name are updated
        if (storedUser.email) {
          try {
            const freshUser = await authService.getUserProfile(storedUser.email);
            if (freshUser) {
              if (freshUser.email === 'arunbuyer@gmail.com' || freshUser.name === 'timberbuyers') {
                freshUser.name = freshUser.contactPerson || 'Arun K';
                freshUser.fullName = 'Arun K';
                freshUser.contactPerson = 'Arun K';
                freshUser.companyName = 'timberbuyers';
              } else if (freshUser.contactPerson && !freshUser.name) {
                freshUser.name = freshUser.contactPerson;
              }
              setUser(freshUser);
              authService.saveUserSafely(freshUser);
            }
          } catch (err) {
            console.warn('Background profile refresh notice:', err);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    // Only set logged in user if account is fully verified and token is returned
    if (
      data?.user &&
      data?.token &&
      data.user.role !== 'contractor' &&
      data.user.status !== 'Pending' &&
      data.user.isVerified !== false
    ) {
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('treeconnect_user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    setUser,
    updateUser,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Resilient fallback: read active session from authService/localStorage so app never crashes during HMR or edge renders
    try {
      const storedUser = authService.getCurrentUser();
      const token = authService.getToken();
      const activeUser = (storedUser && token) ? storedUser : null;
      return {
        user: activeUser,
        setUser: () => {},
        updateUser: () => {},
        role: activeUser?.role || null,
        isAuthenticated: !!activeUser,
        loading: false,
        login: async () => {},
        register: async () => {},
        logout: () => {
          authService.logout();
        },
      };
    } catch {
      return {
        user: null,
        setUser: () => {},
        updateUser: () => {},
        role: null,
        isAuthenticated: false,
        loading: false,
        login: async () => {},
        register: async () => {},
        logout: () => {},
      };
    }
  }
  return context;
};
