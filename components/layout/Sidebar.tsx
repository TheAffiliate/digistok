// components/layout/Sidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { 
  LayoutDashboard, 
  Layers, 
  ShieldCheck, 
  Settings, 
  FileCheck2, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UserState {
  name: string;
  isAdmin: boolean;
  initial: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  const [userState, setUserState] = useState<UserState>({ 
    name: 'Member', 
    isAdmin: false, 
    initial: 'M' 
  });

  useEffect(() => {
    const fetchDirectAuth = async () => {
      try {
        const currentAccount = await account.get();
        const hasAdminLabel = currentAccount.labels?.includes('admin');
        const displayName = currentAccount.name || 'Member';
        
        setUserState({
          name: displayName,
          isAdmin: !!hasAdminLabel,
          initial: displayName.charAt(0).toUpperCase()
        });
      } catch (error) {
        console.warn("No active Appwrite auth session found.", error);
      }
    };
    
    fetchDirectAuth();
  }, []);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Pools', href: '/pools', icon: Layers },
    { label: 'KYC Verification', href: '/kyc', icon: ShieldCheck },
    { label: 'Pool Management', href: '/pool-management', icon: Settings },
    ...(userState.isAdmin
      ? [{ label: 'FICA Approvals', href: '/admin/kyc', icon: FileCheck2 }]
      : []),
    { label: 'My Profile', href: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/auth'); 
      router.refresh();
    }
  };

  const renderSidebarContent = (onClose?: () => void) => (
    <div className="flex flex-col justify-between h-full">
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#00d8d6] tracking-tight">DigiStok</h1>
            <p className="text-xs text-slate-400 mt-0.5">Digital Stokvel Platform</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-200 p-1"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#00d8d6]/10 text-[#00d8d6] border border-[#00d8d6]/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#251c18]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00d8d6]' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#2a1e1a] bg-[#19120f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1b3a39] text-[#00d8d6] flex items-center justify-center font-bold text-sm border border-[#00d8d6]/30">
            {userState.initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{userState.name}</p>
            <p className="text-xs text-slate-400 capitalize">{userState.isAdmin ? 'Admin' : 'Member'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center justify-start gap-2 mt-3 text-xs text-slate-400 hover:text-red-400 transition-colors w-full px-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Banner Header */}
      <div className="md:hidden flex items-center justify-between bg-[#1c1512] border-b border-[#2a1e1a] px-4 py-3 sticky top-0 z-40 w-full shrink-0">
        <h1 className="text-lg font-bold text-[#00d8d6] tracking-tight">DigiStok</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg bg-[#251c18] text-slate-200 hover:bg-[#362721] border border-[#362721] transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-[#00d8d6]" />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1c1512] border-r border-[#2a1e1a] flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(() => setIsOpen(false))}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1c1512] border-r border-[#2a1e1a] flex-col justify-between shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>
    </>
  );
}