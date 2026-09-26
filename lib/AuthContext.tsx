'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { account, databases, functions } from '@/lib/appwrite'; 
import { OAuthProvider } from 'appwrite';
import { useActiveAccount } from 'thirdweb/react';

export interface AuthUser {
  $id: string;
  user_id: string;
  full_name: string;
  email: string;
  wallet_address?: string;
  fica_status: 'pending' | 'approved' | 'rejected';
  id_number?: string;
  digistok_tag?: string;
  phone_number?: string;
  physical_address?: string;
  id_document_url?: string;
  proof_of_residence_url?: string;
  $createdAt: string;
  $updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: 'super_admin' | 'group_admin' | 'member';
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole] = useState<'super_admin' | 'group_admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const activeAccount = useActiveAccount();
  
  // useRef instead of useState to prevent re-render loops
  const isSyncingRef = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
      const userDoc = await databases.getDocument(dbId, 'users', userId);
      
      const userData = userDoc as unknown as AuthUser;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null); 
    }
  }, []);

  // 1. Initial Load: Check Appwrite session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await account.get();
        if (session) {
          await fetchUserProfile(session.$id);
        }
      } catch {
        // No active session, silently ignore
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchUserProfile]);

  // 2. Bridge Thirdweb to Appwrite & Sync Wallet Address
  useEffect(() => {
    const syncOrBridgeWallet = async () => {
      // Use the ref here instead of state
      if (!activeAccount?.address || isSyncingRef.current) return;

      // A. Check if we already have an Appwrite session
      try {
        const session = await account.get();
        if (session) {
          if (user && user.wallet_address !== activeAccount.address) {
            // User is logged in, but connected a different wallet. Update the DB.
            try {
              await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'users',
                user.$id,
                { wallet_address: activeAccount.address }
              );
              setUser(prev => prev ? { ...prev, wallet_address: activeAccount.address } : null);
            } catch (err) {
              console.error('Failed to update wallet address in profile:', err);
            }
          } else if (!user) {
            // Session exists but user object is missing (e.g., page refresh). Fetch it.
            await fetchUserProfile(session.$id);
          }
          return; // We have a session and profile is synced.
        }
      } catch {
        // No active Appwrite session, proceed to bridging
      }

      // B. No Appwrite session. Bridge the wallet to create one.
      isSyncingRef.current = true; // Set the ref
      try {
        const execution = await functions.createExecution(
          process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID!,
          JSON.stringify({ walletAddress: activeAccount.address })
        );

        const response = JSON.parse(execution.responseBody);

        if (response.success) {
          // Create Appwrite session using the custom token from the function
          await account.createSession(response.userId, response.secret);
          // Fetch the newly created or existing profile
          await fetchUserProfile(response.userId);
        } else {
          console.error('Bridge function failed:', response.error);
        }
      } catch (error) {
        console.error('Error bridging Thirdweb wallet to Appwrite:', error);
      } finally {
        isSyncingRef.current = false; // Reset the ref
      }
    };

    syncOrBridgeWallet();
  }, [activeAccount?.address, user, fetchUserProfile]);

  const loginWithGoogle = async () => {
    try {
      await account.createOAuth2Session(
        OAuthProvider.Google,
        'http://localhost:3000/dashboard', 
        'http://localhost:3000/auth'       
      );
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      await fetchUserProfile(session.$id);
      router.push('/dashboard');
    } catch (error) {
      console.error('Email login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUserProfile(user.$id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      isLoading,
      isAuthenticated: !!user,
      loginWithGoogle,
      loginWithEmail,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}