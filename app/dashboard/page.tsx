'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useActiveAccount } from 'thirdweb/react';
import { useQuery } from '@tanstack/react-query';
import { Client, Databases, Query, Models } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Users, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import IncomingInvitations from '@/components/dashboard/IncomingInvitations';
import DeletionGovernance from '@/components/dashboard/DeletionGovernance';

// --- Type Definitions ---
interface ExtendedUser {
  $id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  fica_status?: string;
  isFicaVerified?: boolean;
}

type AppwritePool = Models.Document & {
  name?: string;
  total_value_locked?: number;
  accumulated_yield?: number;
  status?: string;
  contribution_amount?: number;
  rotation_interval?: string;
};

type AppwriteTx = Models.Document & {
  timestamp?: string | number;
  amount?: number;
  type?: string;
};

// --- Appwrite Setup via Environment Variables ---
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a958751003ddf56c626');

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a95dc45001293a69918';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildYieldTrend(yieldTransactions: AppwriteTx[]) {
  const totals: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  yieldTransactions.forEach(tx => {
    const dateVal = tx.timestamp || tx.$createdAt; 
    const day = DAYS[new Date(dateVal).getDay()];
    if (day) totals[day] += (tx.amount || 0);
  });
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ date: d, yield: totals[d] }));
}

export default function Dashboard() {
  const { user: rawUser } = useAuth();
  const user = rawUser as unknown as ExtendedUser | null;
  
  const activeWallet = useActiveAccount();
  const userId = user?.$id || user?.id;

  const { data: pools = [], isLoading: poolsLoading } = useQuery({
    queryKey: ['dashboardPools', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await databases.listDocuments<AppwritePool>(DB_ID, 'pools');
      return res.documents;
    },
    enabled: !!userId,
  });

  const { data: yieldTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['dashboardYields', userId],
    queryFn: async () => {
      try {
        const res = await databases.listDocuments<AppwriteTx>(DB_ID, 'transactions', [
          Query.equal('tx_type', 'yield'),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]);
        return res.documents;
      } catch (error) {
        console.warn("Transactions collection might not exist or lacks read permissions.", error);
        return [];
      }
    },
    enabled: !!userId,
  });
  
  const totalTVL = pools.reduce((sum, pool) => sum + (pool.total_value_locked || 0), 0);
  const totalYield = pools.reduce((sum, pool) => sum + (pool.accumulated_yield || 0), 0);
  const activePools = pools.filter(p => p.status === 'active');
  
  const yieldTrendData = buildYieldTrend(yieldTransactions);
  const poolDistributionData = activePools.slice(0, 5).map(p => ({ 
    name: (p.name || 'Unknown').substring(0, 12), 
    tvl: p.total_value_locked || 0 
  }));

  const isFicaVerified = user?.fica_status === 'verified' || user?.isFicaVerified;

  if (poolsLoading || txLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00d8d6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#00d8d6] mb-2 tracking-tight">DigiStok Dashboard</h1>
            <p className="text-slate-400">Welcome, {user?.full_name || user?.name || 'Member'}</p>
          </div>
          
          {activeWallet && (
            <div className="flex items-center gap-2 bg-[#292524] px-4 py-2 rounded-full border border-[#3f3f46]">
              <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
              <span className="text-sm font-medium text-slate-300">
                {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        <IncomingInvitations />
        <DeletionGovernance pools={pools as unknown as []} memberships={[]} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-300" />
                Total Value Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">R{totalTVL.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Across all pools</p>
            </CardContent>
          </Card>

          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-300" />
                Yield Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#06b6d4]">R{totalYield.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">7.5% APY (simulated)</p>
            </CardContent>
          </Card>

          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-300" />
                Active Pools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activePools.length}</div>
              <p className="text-xs text-slate-500 mt-1">{pools.length} total</p>
            </CardContent>
          </Card>

          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-300" />
                FICA Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`bg-[#292524] border ${isFicaVerified ? 'text-[#06b6d4] border-[#06b6d4] hover:bg-[#06b6d4]/10' : 'text-yellow-500 border-yellow-500 hover:bg-yellow-500/10'}`}>
                {isFicaVerified ? 'Verified' : 'Pending'}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">KYC compliance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader>
              <CardTitle className="text-white text-base">Daily Yield Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yieldTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="yield" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
            <CardHeader>
              <CardTitle className="text-white text-base">Pool Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={poolDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R${val}`} />
                  <Tooltip cursor={{ fill: '#3f3f46' }} contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="tvl" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#3f3f46] bg-[#292524] shadow-none">
          <CardHeader>
            <CardTitle className="text-white text-base">Your Pools</CardTitle>
          </CardHeader>
          <CardContent>
            {pools.length === 0 ? (
              <p className="text-slate-400 py-4">No active pools found.</p>
            ) : (
              <div className="space-y-3">
                {pools.map(pool => (
                  <Link
                    key={pool.$id}
                    href={`/pool/${pool.$id}`}
                    className="flex justify-between items-center p-4 border border-[#3f3f46] rounded-xl bg-[#1c1917] hover:bg-[#3f3f46]/50 transition-all group"
                  >
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-[#06b6d4] transition">{pool.name || 'Unnamed Pool'}</p>
                      <p className="text-sm text-slate-500">R{pool.contribution_amount || 0} / {pool.rotation_interval || 'Monthly'}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <Badge className="mb-1 bg-[#292524] text-slate-300 border border-[#3f3f46] capitalize">
                          {pool.status || 'Pending'}
                        </Badge>
                        <p className="text-xs font-medium text-slate-400">TVL: R{(pool.total_value_locked || 0).toFixed(2)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#06b6d4] transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}