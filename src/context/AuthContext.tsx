import { createContext, useContext } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  selectedPerumahan: string;
  login: (email: string, pass: string, perumahan: string) => Promise<boolean>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};