import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { Perumahan } from '../types/models/perumahan';
import type { ActionResult } from '../types/common';
import { storage } from '../utils/storage';
import { handleApiError } from '../utils/errorHandler';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storage.getToken());
  const [selectedPerumahan, setSelectedPerumahanState] = useState<Perumahan | null>(() => storage.getPerumahan());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    storage.clearAuth();
    setIsAuthenticated(false);
    setSelectedPerumahanState(null);
  }, []);

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
    <AuthContext.Provider value={{ isAuthenticated, selectedPerumahan, isLoading, login, logout, setSelectedPerumahan }}>
      {children}
    </AuthContext.Provider>
  );
};