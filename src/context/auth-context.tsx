'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'driver';

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // For demonstration, we'll start with a default user.
  // In a real app, this would be null until the user logs in.
  const [user, setUser] = useState<User | null>({
    name: 'Admin',
    email: 'admin@rotacerta.com',
    role: 'admin',
  });

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
