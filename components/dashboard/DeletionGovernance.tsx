'use client';

interface DeletionGovernanceProps {
  pools?: unknown[];
  memberships?: unknown[];
}

export default function DeletionGovernance({ pools = [], memberships = [] }: DeletionGovernanceProps) {
  const activePoolsCount = pools.length;
  const membershipCount = memberships.length;

  return (
    <div className="mb-6 p-4 rounded-xl border border-[#2e221e] bg-[#211815]">
      <h3 className="font-semibold text-white text-sm">Deletion Governance</h3>
      <p className="text-xs text-slate-400 mt-1">
        No active deletion votes across {activePoolsCount} pools ({membershipCount} memberships).
      </p>
    </div>
  );
}