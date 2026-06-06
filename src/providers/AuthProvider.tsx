import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { Perumahan } from '../types/models/perumahan';
import type { ActionResult } from '../types/common';
import { storage } from '../utils/storage';
import { disconnectSocket, refreshSocketAuth } from '../lib/socket';
import { handleApiError } from '../utils/errorHandler';
import type { User } from '../types/models/user';
import { useQueryClient } from '@tanstack/react-query';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getToken());
  const [selectedPerumahan, setSelectedPerumahanState] = useState<Perumahan | null>(() => storage.getPerumahan());
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    disconnectSocket();
    storage.clearAuth();
    setIsAuthenticated(false);
    setSelectedPerumahanState(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email: string, pass: string, perumahan: Perumahan): Promise<ActionResult> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, pass, perumahan.id);
      if (response.success && response.data) {
        storage.setToken(response.data.token);
        storage.setUser(response.data.user);
        storage.setPerumahan(perumahan);
        setIsAuthenticated(true);
        setSelectedPerumahanState(perumahan);
        setUser(response.data.user);
        refreshSocketAuth();
        return { success: true };
      }
      return { success: false, message: response.message || 'Login gagal.' };
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginCustomer = async (email: string, pass: string): Promise<ActionResult> => {
    setIsLoading(true);
    try {
      const response = await authService.loginCustomer(email, pass);
      if (response.success && response.data) {
        storage.setToken(response.data.token);
        storage.setUser(response.data.user);
        setIsAuthenticated(true);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login gagal.' };
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAgent = async (email: string, pass: string): Promise<ActionResult> => {
    setIsLoading(true);
    try {
      const response = await authService.loginAgent(email, pass);
      if (response.success && response.data) {
        storage.setToken(response.data.token);
        storage.setUser(response.data.user);
        setIsAuthenticated(true);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login gagal.' };
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedPerumahan = (perumahan: Perumahan) => {
    storage.setPerumahan(perumahan);
    setSelectedPerumahanState(perumahan);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        selectedPerumahan,
        isLoading,
        login,
        loginCustomer,
        loginAgent,
        logout,
        setSelectedPerumahan,
        setUser: (nextUser) => {
          storage.setUser(nextUser);
          setUser(nextUser);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};