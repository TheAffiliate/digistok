'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function PoolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#140e0c] text-slate-200 flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 w-full p-4 md:p-8 bg-[#140e0c] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}