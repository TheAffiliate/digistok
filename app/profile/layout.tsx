// app/profile/layout.tsx
'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#140e0c] text-slate-200 flex flex-col md:flex-row">
      {/* Sidebar handles its own desktop sticky sidebar AND mobile top banner/drawer */}
      <Sidebar />

      {/* Main content container fills remaining width and stacks neatly under the mobile banner */}
      <main className="flex-1 w-full bg-[#140e0c] p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}