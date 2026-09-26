'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, Wallet, AlertCircle } from 'lucide-react';
import { useConnectModal } from 'thirdweb/react';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { account } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { useAuth } from '@/lib/AuthContext';

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error('Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID in .env.local');
}

const client = createThirdwebClient({ clientId });

const wallets = [
  inAppWallet({
    auth: {
      options: ['google', 'email', 'passkey'],
    },
  }),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
  createWallet('walletConnect'),
];

const activeChain = defineChain(11155111); // Sepolia testnet

export default function AuthPage() {
  const router = useRouter();
  const { bridgeWallet } = useAuth(); // 👈 Pull bridgeWallet from context
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connect, isConnecting } = useConnectModal();

  // ---------- External wallet (MetaMask, Coinbase, etc.) ----------
  const handleConnectWallet = async () => {
    setError(null);
    try {
      const wallet = await connect({
        client,
        wallets,
        size: 'compact',
        title: 'Choose a Wallet',
        showThirdwebBranding: false,
      });

      const address = wallet?.getAccount()?.address;
      if (address) {
        console.log('Connected wallet account:', address);

        // 👇 Explicitly bridge the wallet — don't wait for context sync
        const success = await bridgeWallet(address);
        if (success) {
          router.push('/dashboard');
        } else {
          setError('Failed to create session. Please try again.');
        }
      }
    } catch (err) {
      console.log('Wallet connection closed or failed:', err);
    }
  };

  // ---------- Google (via embedded wallet) ----------
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const wallet = inAppWallet();
      const connectedAccount = await wallet.connect({
        client,
        chain: activeChain,
        strategy: 'google',
      });

      if (connectedAccount?.address) {
        console.log('Connected embedded wallet:', connectedAccount.address);

        // 👇 Explicitly bridge the wallet — this is the missing piece
        const success = await bridgeWallet(connectedAccount.address);
        if (success) {
          router.push('/dashboard');
        } else {
          setError('Failed to create session. Please try again.');
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Google sign in failed';
      if (!errorMessage.toLowerCase().includes('cancel')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Email / password ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await account.create(ID.unique(), email, password);
        await account.createEmailPasswordSession(email, password);
      } else {
        await account.createEmailPasswordSession(email, password);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fb] p-4 font-sans text-slate-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {/* Navigation & Brand Header */}
        {isSignUp ? (
          <button
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to sign in
          </button>
        ) : (
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-[#1b4332] flex items-center justify-center shadow-inner">
              <svg className="w-9 h-9" viewBox="0 0 40 40" fill="none">
                <circle cx="16" cy="20" r="10" stroke="#10b981" strokeWidth="4" />
                <circle cx="24" cy="20" r="10" stroke="#8b5cf6" strokeWidth="4" />
              </svg>
            </div>
          </div>
        )}

        {/* Dynamic Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isSignUp ? 'Create your account' : 'Welcome to DigiStok'}
          </h1>
          {!isSignUp && (
            <p className="text-xs text-slate-500 mt-1">Sign in to continue</p>
          )}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isSignUp ? (
          <div className="space-y-3">
            {/* Connect Web3 Wallet */}
            <button
              type="button"
              onClick={handleConnectWallet}
              disabled={isConnecting || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs font-semibold text-[#065f46] hover:bg-[#10b981]/20 transition shadow-sm disabled:opacity-50"
            >
              <Wallet className="w-4 h-4 text-[#10b981]" />
              {isConnecting ? 'Opening Wallets...' : 'Connect Web3 Wallet'}
            </button>

            {/* Google Social Auth via embedded wallet */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-semibold text-slate-400 absolute">
                OR EMAIL
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-center text-[11px] font-medium text-slate-600 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-center text-[11px] font-medium text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0e1626] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
              <a href="#" className="hover:underline">
                Forgot password?
              </a>
              <div>
                Need an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-center text-[11px] font-medium text-slate-600 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-center text-[11px] font-medium text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-center text-[11px] font-medium text-slate-600 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0e1626] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}