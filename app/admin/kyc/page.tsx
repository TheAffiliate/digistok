'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, Databases, Query, Models } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, FileText, ShieldAlert, Users } from 'lucide-react';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;
const USERS_COLLECTION = 'users';
const POOLS_COLLECTION = 'pools';

interface UserProfileDocument extends Models.Document {
  user_id: string;
  full_name: string;
  email: string;
  wallet_address?: string;
  fica_status: 'pending' | 'verified' | 'rejected';
  id_number?: string;
  phone_number?: string;
  physical_address?: string;
  digistok_tag?: string;
  id_document_url?: string;
  proof_of_residence_url?: string;
}

interface PoolDocument extends Models.Document {
  name: string;
  description?: string;
  contribution_amount: number;
  rotation_interval: 'weekly' | 'monthly';
  max_members?: number;
  status: 'active' | 'pending' | 'closed' | 'auto_rejected';
  rejection_reason?: string;
}

interface AdminKYCProps {
  userRole?: 'admin' | 'member';
}

const TABS = [
  { key: 'fica', label: 'FICA Approvals' },
  { key: 'pools', label: 'Pool Applications' },
] as const;

export default function AdminKYC({ userRole = 'admin' }: AdminKYCProps) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<UserProfileDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'fica' | 'pools'>('fica');

  // Fetch unverified / pending FICA profiles
  const { data: ficaProfiles = [], isLoading: ficaLoading } = useQuery({
    queryKey: ['ficaProfiles'],
    queryFn: async () => {
      const response = await databases.listDocuments<UserProfileDocument>(
        DB_ID,
        USERS_COLLECTION,
        [Query.notEqual('fica_status', 'verified')]
      );
      return response.documents;
    },
    enabled: userRole === 'admin',
  });

  // Fetch verified FICA count
  const { data: approvedCount = 0 } = useQuery({
    queryKey: ['ficaApprovedCount'],
    queryFn: async () => {
      const response = await databases.listDocuments<UserProfileDocument>(
        DB_ID,
        USERS_COLLECTION,
        [Query.equal('fica_status', 'verified')]
      );
      return response.total;
    },
    enabled: userRole === 'admin',
  });

  const approveFicaMutation = useMutation({
    mutationFn: (documentId: string) =>
      databases.updateDocument(DB_ID, USERS_COLLECTION, documentId, {
        fica_status: 'verified',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ficaProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['ficaApprovedCount'] });
      setSelectedProfile(null);
    },
  });

  const rejectFicaMutation = useMutation({
    mutationFn: (documentId: string) =>
      databases.updateDocument(DB_ID, USERS_COLLECTION, documentId, {
        fica_status: 'rejected',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ficaProfiles'] });
      setSelectedProfile(null);
    },
  });

  // Fetch pending pools
  const { data: pendingPools = [], isLoading: poolsLoading } = useQuery({
    queryKey: ['pendingAdminPools'],
    queryFn: async () => {
      const response = await databases.listDocuments<PoolDocument>(
        DB_ID,
        POOLS_COLLECTION,
        [Query.equal('status', 'pending')]
      );
      return response.documents;
    },
    enabled: userRole === 'admin',
  });

  const approvePoolMutation = useMutation({
    mutationFn: (documentId: string) =>
      databases.updateDocument(DB_ID, POOLS_COLLECTION, documentId, {
        status: 'active',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingAdminPools'] }),
  });

  const rejectPoolMutation = useMutation({
    mutationFn: (documentId: string) =>
      databases.updateDocument(DB_ID, POOLS_COLLECTION, documentId, {
        status: 'auto_rejected',
        rejection_reason: 'Rejected by administrator.',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingAdminPools'] }),
  });

  if (userRole !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="border-border bg-card max-w-md w-full">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
            <ShieldAlert className="w-10 h-10 text-destructive" />
            <p className="text-muted-foreground">Access restricted to Admins only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingFicaCount = ficaProfiles.filter((p) => p.fica_status === 'pending').length;
  const rejectedFicaCount = ficaProfiles.filter((p) => p.fica_status === 'rejected').length;

  return (
    <div className="p-8 bg-background min-h-screen text-foreground">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Approvals</h1>
            <p className="text-muted-foreground mt-1">Review user FICA documents and pending pool applications</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.key === 'pools' && pendingPools.length > 0 && (
                <Badge className="ml-2 text-xs bg-primary text-primary-foreground">{pendingPools.length}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* FICA Tab */}
        {activeTab === 'fica' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border bg-card">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-foreground">{pendingFicaCount}</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs text-muted-foreground mb-1">Verified Users</p>
                  <p className="text-3xl font-bold text-primary">{approvedCount}</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-5 pb-5">
                  <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{rejectedFicaCount}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Pending & Unverified Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {ficaLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : ficaProfiles.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center">All user applications have been reviewed.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="py-3 px-4 text-muted-foreground font-medium">Name</th>
                          <th className="py-3 px-4 text-muted-foreground font-medium">Tag</th>
                          <th className="py-3 px-4 text-muted-foreground font-medium">Status</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ficaProfiles.map((profile) => (
                          <tr key={profile.$id} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="py-3 px-4 text-foreground font-medium">{profile.full_name || '—'}</td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">{profile.digistok_tag || '—'}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={profile.fica_status === 'rejected' ? 'destructive' : 'secondary'}
                                className="capitalize"
                              >
                                {profile.fica_status || 'pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2 justify-end">
                                {profile.id_document_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProfile(profile)}
                                    className="text-primary hover:text-primary"
                                  >
                                    <FileText className="w-4 h-4 mr-1" /> Review
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => approveFicaMutation.mutate(profile.$id)}
                                  disabled={approveFicaMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectFicaMutation.mutate(profile.$id)}
                                  disabled={rejectFicaMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Pool Applications Tab */}
        {activeTab === 'pools' && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Pools Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {poolsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : pendingPools.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">No pool applications pending review.</p>
              ) : (
                <div className="space-y-4">
                  {pendingPools.map((pool) => (
                    <div key={pool.$id} className="p-4 border border-border rounded-lg bg-secondary/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{pool.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{pool.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              R{pool.contribution_amount} / {pool.rotation_interval}
                            </span>
                            <span>Max {pool.max_members || '∞'} members</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => approvePoolMutation.mutate(pool.$id)}
                            disabled={approvePoolMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectPoolMutation.mutate(pool.$id)}
                            disabled={rejectPoolMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* FICA Document Review Modal */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Review Documents — {selectedProfile?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-5">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Tag:</span>{' '}
                  <span className="text-primary">{selectedProfile.digistok_tag || '—'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="text-foreground">{selectedProfile.phone_number || '—'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">ID Number:</span>{' '}
                  <span className="text-foreground">{selectedProfile.id_number || '—'}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="text-foreground">{selectedProfile.physical_address || '—'}</span>
                </p>
              </div>
              <div className="space-y-2">
                {selectedProfile.id_document_url && (
                  <a
                    href={selectedProfile.id_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-secondary transition text-primary text-sm"
                  >
                    <FileText className="w-4 h-4" /> View ID Document
                  </a>
                )}
                {selectedProfile.proof_of_residence_url && (
                  <a
                    href={selectedProfile.proof_of_residence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-secondary transition text-primary text-sm"
                  >
                    <FileText className="w-4 h-4" /> View Proof of Residence
                  </a>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => approveFicaMutation.mutate(selectedProfile.$id)}
                  disabled={approveFicaMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button
                  onClick={() => rejectFicaMutation.mutate(selectedProfile.$id)}
                  disabled={rejectFicaMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}