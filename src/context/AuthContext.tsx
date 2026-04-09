import { createContext, useContext } from 'react';
import type { Perumahan } from '../types/models/perumahan';
import type { ActionResult } from '../types/common';

export interface AuthContextType {
  isAuthenticated: boolean;
  selectedPerumahan: Perumahan | null;
  isLoading: boolean;
  login: (email: string, pass: string, perumahan: Perumahan) => Promise<ActionResult>;
  logout: () => void;
  setSelectedPerumahan: (perumahan: Perumahan) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};