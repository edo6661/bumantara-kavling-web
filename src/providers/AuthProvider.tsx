
import { useState, type ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPerumahan, setSelectedPerumahan] = useState('');

  const login = async (email: string, pass: string, perumahan: string) => {
    try {

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === 'admin@gmail.com' && pass === 'password') {
        setIsAuthenticated(true);
        setSelectedPerumahan(perumahan);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSelectedPerumahan('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, selectedPerumahan, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};