'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, Users, TrendingUp } from 'lucide-react';

interface Pool {
  $id: string;
  pool_id: string;
  name: string;
  description?: string;
  contribution_amount: number;
  rotation_interval: string;
  status: string;
  max_members: number;
  creator_id: string;
}

export default function AvailablePools() {
  const { user } = useAuth();
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

        // Get all pools that are open for joining
        const res = await databases.listDocuments(dbId, 'pools', [
          Query.equal('status', ['pending', 'active']),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ]);

        let available = res.documents as unknown as Pool[];

        // Filter out pools the user is already a member of
        if (user) {
          const memberships = await databases.listDocuments(dbId, 'memberships', [
            Query.equal('user_id', user.user_id),
          ]);
          const joinedPoolIds = new Set(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            memberships.documents.map((m: any) => m.pool_id)
          );
          available = available.filter((p) => !joinedPoolIds.has(p.pool_id));
        }

        setPools(available);
      } catch (error) {
        console.error('Error fetching available pools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailable();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#00d8d6]/30 border-t-[#00d8d6] rounded-full animate-spin" />
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <Card className="border-[#2a1e1a] bg-[#1c1512]">
        <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
          <Compass className="w-10 h-10 text-slate-500" />
          <p className="text-slate-400">
            No available pools right now. Check back later or create your own.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pools.map((pool) => (
        <button
          key={pool.$id}
          onClick={() => router.push(`/pools/${pool.$id}`)}
          className="text-left p-5 border border-[#2a1e1a] rounded-xl bg-[#1c1512] hover:bg-[#251c18] hover:border-[#00d8d6]/30 transition group"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold text-slate-200 group-hover:text-[#00d8d6] transition">
              {pool.name}
            </p>
            <Badge
              variant={pool.status === 'active' ? 'default' : 'secondary'}
              className="capitalize text-xs"
            >
              {pool.status}
            </Badge>
          </div>

          {pool.description && (
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
              {pool.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              R{pool.contribution_amount}
            </span>
            <span className="capitalize">{pool.rotation_interval}</span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Max {pool.max_members}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}