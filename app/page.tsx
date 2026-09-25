// app/page.tsx
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Repeat, Coins, Activity, Lock, Cpu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#161312] text-slate-200 font-sans selection:bg-[#05d5d6]/30">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="font-bold text-2xl text-[#05d5d6] tracking-tight">DigiStok</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/auth"
            className="text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            className="px-5 py-2.5 bg-[#201c1b] border border-white/10 rounded-lg text-sm font-semibold text-white hover:border-[#05d5d6]/50 hover:bg-[#05d5d6]/10 transition-all"
          >
            Connect Wallet
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#05d5d6] bg-[#05d5d6]/10 border border-[#05d5d6]/20 rounded-full mb-8">
          <Activity className="w-4 h-4" />
          <span>V1 Prototype Now Live</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-tight mb-8">
          The Future of <span className="text-transparent bg-clip-text bg-linear-to-r from-[#05d5d6] to-blue-500">Rotational Savings</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
          DigiStok modernizes traditional stokvels. By leveraging smart contract governance and USDT stablecoins, your community pools are secured against volatility while actively generating yield through Aave V3.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#05d5d6] text-[#161312] px-8 py-4 rounded-xl text-base font-bold hover:bg-[#04b8b9] transition shadow-[0_0_20px_rgba(5,213,214,0.3)]"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#architecture"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#201c1b] border border-white/10 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/5 transition"
          >
            Read the Docs
          </a>
        </div>

        {/* Feature Grid */}
        <div id="architecture" className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          {/* Feature 1 */}
          <div className="bg-[#201c1b] p-8 rounded-2xl border border-white/5 hover:border-[#05d5d6]/30 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-[#05d5d6]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6 text-[#05d5d6]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">USDT Stability</h3>
            <p className="text-slate-400 leading-relaxed">
              Contributions are locked in USDT, protecting your rotating savings from local currency devaluation and crypto market volatility.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#201c1b] p-8 rounded-2xl border border-white/5 hover:border-[#05d5d6]/30 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-[#05d5d6]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-[#05d5d6]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Aave V3 Yield Integration</h3>
            <p className="text-slate-400 leading-relaxed">
              Idle capital doesn&apos;t just sit there. Pooled funds are routed through decentralized lending protocols to generate passive 7.5% APY while waiting for payout cycles.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#201c1b] p-8 rounded-2xl border border-white/5 hover:border-[#05d5d6]/30 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-[#05d5d6]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-[#05d5d6]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Contract Governance</h3>
            <p className="text-slate-400 leading-relaxed">
              Trustless execution. Member turns, payout distributions, and slashing conditions for missed payments are hardcoded and executed automatically on-chain.
            </p>
          </div>
        </div>

        {/*  Identity Section */}
        <div className="mt-8 bg-[#201c1b] border border-white/5 rounded-2xl p-8 sm:p-12 text-left flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#05d5d6]" />
              <span className="text-[#05d5d6] font-semibold tracking-wide uppercase text-sm">FICA & KYC Compliant</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Civic Identity</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              Security and compliance are built into the foundation. By integrating digital civic identity systems, DigiStok ensures all pool members are verified, eliminating sybil attacks and ensuring accountability across all saving groups.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-300">
                <ShieldCheck className="w-5 h-5 text-[#05d5d6]" /> Proof of Identity checks
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Repeat className="w-5 h-5 text-[#05d5d6]" /> Transparent audit trails
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full flex justify-center">
             {/* Abstract Graphic Representing KYC */}
             <div className="w-full max-w-sm aspect-square rounded-full border border-dashed border-white/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-linear-to-tr from-[#05d5d6]/5 to-transparent rounded-full animate-pulse" />
                <div className="w-3/4 h-3/4 border border-[#05d5d6]/30 rounded-full flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-[#05d5d6]/10 rounded-full backdrop-blur-md border border-[#05d5d6]/50 flex items-center justify-center shadow-[0_0_30px_rgba(5,213,214,0.2)]">
                    <Lock className="w-8 h-8 text-[#05d5d6]" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}