'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Layers, Compass } from 'lucide-react';
import AvailablePools from '@/components/pools/AvailablePools';

interface Pool {
  $id: string;
  pool_id: string;
  name: string;
  description?: string;
  contribution_amount: number;
  rotation_interval: string;
  status: string;
  max_members: number;
  contract_address?: string;
  creator_id: string;
  $createdAt: string;
}

export default function PoolsPage() {
  const { user, userRole, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<'mine' | 'discover'>('mine');
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const userId = user.user_id; // Appwrite Auth user ID

        if (userRole === 'super_admin') {
          // Super admin: all pools
          const res = await databases.listDocuments(dbId, 'pools', [
            Query.orderDesc('$createdAt'),
          ]);
          setPools(res.documents as unknown as Pool[]);
        } else if (userRole === 'group_admin') {
          // Group admin: only pools they created
          const res = await databases.listDocuments(dbId, 'pools', [
            Query.equal('creator_id', userId),
            Query.orderDesc('$createdAt'),
          ]);
          setPools(res.documents as unknown as Pool[]);
        } else {
          // Member: find their memberships, then load each pool
          const memberships = await databases.listDocuments(dbId, 'memberships', [
            Query.equal('user_id', userId),
          ]);

          if (memberships.total === 0) {
            setPools([]);
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const poolIds = memberships.documents.map((m: any) => m.pool_id);
          const poolResults = await Promise.all(
            poolIds.map((poolId: string) =>
              databases.listDocuments(dbId, 'pools', [Query.equal('pool_id', poolId)])
            )
          );

          const flatPools = poolResults
            .flatMap((res) => res.documents)
            .filter(Boolean) as unknown as Pool[];

          setPools(flatPools);
        }
      } catch (error) {
        console.error('Error fetching pools:', error);
        setPools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
  }, [user, userRole]);

  if (authLoading || isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#00d8d6]/30 border-t-[#00d8d6] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-200">Pools</h1>
          <p className="text-slate-400 mt-1">Manage and discover stokvel pools</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#2a1e1a]">
          <button
            onClick={() => setTab('mine')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'mine'
                ? 'border-[#00d8d6] text-[#00d8d6]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> My Pools
          </button>
          <button
            onClick={() => setTab('discover')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'discover'
                ? 'border-[#00d8d6] text-[#00d8d6]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" /> Available Pools
          </button>
        </div>

        {tab === 'discover' && <AvailablePools />}

        {tab === 'mine' && pools.length === 0 && (
          <Card className="border-[#2a1e1a] bg-[#1c1512]">
            <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
              <Layers className="w-10 h-10 text-slate-500" />
              <p className="text-slate-400">
                No pools found. Join or create a pool to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {tab === 'mine' && pools.length > 0 && (
          <div className="grid gap-4">
            {pools.map((pool) => (
              <Link
                key={pool.$id}
                href={`/pools/${pool.$id}`}
                className="flex justify-between items-center p-5 border border-[#2a1e1a] rounded-xl bg-[#1c1512] hover:bg-[#251c18] transition group"
              >
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-[#00d8d6] transition text-lg">
                    {pool.name}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {pool.description ||
                      `R${pool.contribution_amount} / ${pool.rotation_interval}`}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-slate-500">
                      R{pool.contribution_amount} contribution
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {pool.rotation_interval}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[#00d8d6] font-semibold">
                      {pool.max_members} members
                    </p>
                    <p className="text-xs text-slate-500">Max capacity</p>
                    <Badge
                      variant={pool.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1 capitalize"
                    >
                      {pool.status}
                    </Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#00d8d6] transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}