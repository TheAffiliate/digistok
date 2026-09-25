'use client';

import React, { createContext, useContext } from 'react';

interface AuthUser {
  id: string;
  full_name?: string;
  isFicaVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: 'super_admin' | 'group_admin' | 'member';
}

const AuthContext = createContext<AuthContextType>({
  user: { id: 'demo_user', full_name: 'Member', isFicaVerified: true },
  userRole: 'member',
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: { id: 'demo_user', full_name: 'Member', isFicaVerified: true }, userRole: 'member' }}>
      {children}
    </AuthContext.Provider>
  );
}