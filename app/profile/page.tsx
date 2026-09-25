'use client';

import React, { useEffect, useState } from 'react';
import { Client, Account, Databases, Query, Models } from 'appwrite';
import { User, ShieldAlert, Upload, CheckCircle2, Trash2, Power } from 'lucide-react';

// Initialize Client using environment variables exclusively
const client = new Client();

if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
}
if (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
}

const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

interface AppwriteUser extends Models.User<Models.Preferences> {
  isAdmin?: boolean;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<AppwriteUser | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    idNumber: '',
    address: '',
    ficaStatus: 'pending',
    reputation: 100,
    accountStatus: 'active',
    saIdOnFile: true,
    proofResOnFile: true,
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const currentAccount = await account.get();
        const isAdmin = currentAccount.labels?.includes('admin') || false;

        setUser({ ...currentAccount, isAdmin });
        setFormData((prev) => ({
          ...prev,
          fullName: currentAccount.name || '',
          username: currentAccount.name ? `@${currentAccount.name.toLowerCase().replace(/\s+/g, '')}` : '@user',
        }));

        if (DATABASE_ID) {
          try {
            const res = await databases.listDocuments(DATABASE_ID, 'users', [
              Query.equal('user_id', currentAccount.$id),
            ]);
            if (res.documents.length > 0) {
              const doc = res.documents[0];
              setFormData((prev) => ({
                ...prev,
                phone: doc.phone || prev.phone,
                idNumber: doc.idNumber || prev.idNumber,
                address: doc.address || prev.address,
                ficaStatus: doc.fica_status || prev.ficaStatus,
                reputation: doc.reputation ?? 100,
              }));
            }
          } catch (dbErr) {
            console.warn('Profile database document collection not initialized:', dbErr);
          }
        }
      } catch (err) {
        console.error('Failed to load Appwrite user session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        await account.updateName(formData.fullName);
      }
    } catch (err) {
      console.error('Failed to update account name:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-lg bg-[#1c1512] border border-[#2a1e1a] text-[#00d8d6]">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-400">
            Manage your personal details, verification status, and account settings.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading user details...</div>
      ) : (
        <div className="space-y-6">
          {/* User Summary Card */}
          <div className="p-6 rounded-xl bg-[#1c1512] border border-[#2a1e1a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1b3a39] text-[#00d8d6] border border-[#00d8d6]/30 flex items-center justify-center text-2xl font-bold">
                {formData.fullName.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{formData.fullName || 'Member'}</h2>
                  {user?.isAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b3a39] text-[#00d8d6] font-medium border border-[#00d8d6]/30">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formData.username}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium capitalize">
                FICA {formData.ficaStatus}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-[#00d8d6]/10 text-[#00d8d6] border border-[#00d8d6]/30 font-medium">
                ⭐ Reputation {formData.reputation}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium capitalize">
                {formData.accountStatus}
              </span>
            </div>
          </div>

          {/* Form Details */}
          <form onSubmit={handleSave} className="p-6 rounded-xl bg-[#1c1512] border border-[#2a1e1a] space-y-5">
            <h3 className="text-base font-semibold text-white">Edit Profile</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">DigiStok Tag</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#251c18] border border-[#362721] text-sm text-slate-200 focus:outline-none focus:border-[#00d8d6]"
              />
              <p className="text-[11px] text-slate-500">Others use this tag to invite you to pools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#251c18] border border-[#362721] text-sm text-slate-200 focus:outline-none focus:border-[#00d8d6]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#251c18] border border-[#362721] text-sm text-slate-200 focus:outline-none focus:border-[#00d8d6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">South African ID Number</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#251c18] border border-[#362721] text-sm text-slate-200 focus:outline-none focus:border-[#00d8d6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Physical Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#251c18] border border-[#362721] text-sm text-slate-200 focus:outline-none focus:border-[#00d8d6] resize-none"
              />
            </div>

            {/* FICA Documents */}
            <div className="pt-2">
              <h4 className="text-xs font-medium text-slate-300 mb-3">FICA Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-[#251c18] border border-[#362721] flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">SA ID / Passport</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    {formData.saIdOnFile && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#00d8d6]/10 text-[#00d8d6] font-medium border border-[#00d8d6]/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> On file
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#251c18] border border-[#362721] flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Proof of Residence</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    {formData.proofResOnFile && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#00d8d6]/10 text-[#00d8d6] font-medium border border-[#00d8d6]/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> On file
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg bg-[#00d8d6] hover:bg-[#00c2c0] text-[#120e0c] font-semibold text-sm transition-all"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Account Management (Danger Zone) */}
          <div className="p-6 rounded-xl bg-[#1c1512] border border-[#2a1e1a] space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>Account Management</span>
            </div>

            <div className="p-4 rounded-lg bg-[#251c18] border border-[#362721] flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-rose-400" /> Deactivate Account
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Temporarily disable your profile; you can reactivate any time.
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-all shrink-0"
              >
                Deactivate
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#251c18] border border-[#362721] flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Profile
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Permanently remove your profile and saved details. Your user account remains.
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-all shrink-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}