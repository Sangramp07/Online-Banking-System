import React from 'react';
import { ShieldCheck, Target, Eye, Lock, Cpu, Database } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About NEXBANK
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          NEXBANK is an advanced digital banking demonstration platform designed to showcase enterprise-grade full-stack architecture, transactional safety, and financial ledger integrity.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            To provide developers, finance enthusiasts, and architects with a crystal-clear reference implementation of how modern online banks handle race-condition-free fund transfers, double-entry ledgers, and impenetrable security boundaries.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            To set the benchmark for educational full-stack software simulations by marrying aesthetic UI design with industrial backend precision, real-world MySQL transactions, and rigorous authorization guarantees.
          </p>
        </div>
      </div>

      {/* Engineering Foundations */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Architecture & Security Principles
          </h2>
          <p className="text-xs text-slate-500">
            Every layer of NEXBANK is constructed in adherence with zero-trust software engineering standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Database className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Database Consistency
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Implemented using MySQL 8.0, Prisma ORM, and Serializable transaction isolation levels, guaranteeing that concurrent debit/credit operations never cause negative balances or phantom reads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Lock className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Defense-In-Depth Security
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bcrypt salted password hashing, HttpOnly SameSite cookies, CSRF defenses, rate limiters on sensitive endpoints, and continuous audit logs tracking all administrator and customer operations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Cpu className="w-8 h-8 text-indigo-500 mb-4" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Idempotent Financial Operations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every fund transfer accepts an idempotency key. Network retries or rapid double-clicks return identical cached transfer receipts without repeatedly deducting funds.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Disclaimer Banner */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Educational Banking Simulation Notice
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            NEXBANK does not claim to be a licensed bank or financial depository institution. It is not affiliated with the FDIC, Federal Reserve, or any governmental regulatory entity. All monetary amounts, customer profiles, and transaction records exist purely for software demonstration and learning purposes.
          </p>
        </div>
      </div>
    </div>
  );
};
