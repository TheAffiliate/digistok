'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { account, databases, functions } from '@/lib/appwrite';
import { OAuthProvider, Query } from 'appwrite';
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
  bridgeWallet: (walletAddress: string) => Promise<boolean>;
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
  const isSyncingRef = useRef(false);

  // ---------- Fetch user profile (query by user_id field, not document ID) ----------
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

      const res = await databases.listDocuments(dbId, 'users', [
        Query.equal('user_id', userId),
      ]);

      if (res.total === 0) {
        console.warn('No user profile found for Auth ID:', userId);
        setUser(null);
        return;
      }

      setUser(res.documents[0] as unknown as AuthUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  }, []);

  // ---------- Bridge Wallet → Appwrite session (callable) ----------
  const bridgeWallet = useCallback(
    async (walletAddress: string): Promise<boolean> => {
      if (!walletAddress || isSyncingRef.current) return false;

      // If we already have a session, just refresh the profile
      try {
        const session = await account.get();
        if (session) {
          await fetchUserProfile(session.$id);
          return true;
        }
      } catch {
        // No session, proceed to bridge
      }

      isSyncingRef.current = true;
      try {
        const execution = await functions.createExecution(
          process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID!,
          JSON.stringify({ walletAddress })
        );

        const response = JSON.parse(execution.responseBody);

        if (response.success) {
          await account.createSession(response.userId, response.secret);
          await fetchUserProfile(response.userId);
          return true;
        }

        console.error('Bridge function failed:', response.error);
        return false;
      } catch (error) {
        console.error('Error bridging wallet to Appwrite:', error);
        return false;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [fetchUserProfile]
  );

  // ---------- Initial load: check Appwrite session ----------
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await account.get();
        if (session) {
          await fetchUserProfile(session.$id);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [fetchUserProfile]);

  // ---------- Auto-bridge whenever Thirdweb wallet connects ----------
  useEffect(() => {
    if (!activeAccount?.address) return;

    // If we already have a session with a user, just sync the wallet address
    const syncWallet = async () => {
      try {
        const session = await account.get();
        if (session) {
          if (user && user.wallet_address !== activeAccount.address) {
            try {
              await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                'users',
                user.$id,
                { wallet_address: activeAccount.address }
              );
              setUser((prev) =>
                prev ? { ...prev, wallet_address: activeAccount.address } : null
              );
            } catch (err) {
              console.error('Failed to update wallet address:', err);
            }
          } else if (!user) {
            await fetchUserProfile(session.$id);
          }
          return;
        }
      } catch {
        // No session, proceed with bridge
      }

      // No session — bridge the wallet
      await bridgeWallet(activeAccount.address);
    };

    syncWallet();
  }, [activeAccount?.address, user, fetchUserProfile, bridgeWallet]);

  // ---------- Auth actions ----------
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
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        loginWithEmail,
        logout,
        refreshUser,
        bridgeWallet, // ✅ Now included — this was the missing piece
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}