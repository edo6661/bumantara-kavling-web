import { useState, type ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPerumahan, setSelectedPerumahan] = useState('');

  const login = (email: string, pass: string, perumahan: string) => {
    if (email === 'admin@gmail.com' && pass === 'password') {
      setIsAuthenticated(true);
      setSelectedPerumahan(perumahan);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSelectedPerumahan('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, selectedPerumahan, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};