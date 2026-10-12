import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Zap,
  Lock,
  FileText,
  ChevronDown,
  Building,
  CheckCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Is NEXBANK a real bank?',
      a: 'No. NEXBANK is an educational digital banking simulation and full-stack software architecture showcase. All accounts, customers, balances, and transactions use simulated demo data. No actual money is processed.',
    },
    {
      q: 'How does NEXBANK guarantee financial integrity?',
      a: 'We implement double-entry ledger transactions, database-level serializable isolation, row-level locking, and idempotency keys to ensure mathematical balance and prevent overdrafts or double spending.',
    },
    {
      q: 'Can I test both Customer and Administrator dashboards?',
      a: 'Yes! We provide built-in pre-seeded demo accounts with one-click login buttons on the Sign In page for both customers (Alex Morgan, Sarah Jenkins, Michael Chang) and the system administrator.',
    },
    {
      q: 'How do fund transfers work?',
      a: 'Transfers execute atomically in MySQL transactions. Balanced debit and credit entries are generated instantly, balances are adjusted with decimal precision, and notifications are sent to the participating accounts.',
    },
  ];

  return (
    <div className="space-y-24 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold animate-pulse">
          <Zap className="w-3.5 h-3.5 text-blue-500" />
          <span>Next-Generation Online Banking Platform Simulation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          The Future of Digital Banking,{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-400 bg-clip-text text-transparent">
            Engineered with Precision.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Experience a full-stack digital banking simulation with atomic fund transfers, double-entry financial ledger accounting, and real-time analytics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition duration-200"
          >
            Open Demo Account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold px-8 py-3.5 rounded-xl text-slate-800 dark:text-slate-200 transition duration-200"
          >
            Sign In with Demo Credential
          </Link>
        </div>

        {/* Hero KPI Stat Strip */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">$100k</p>
            <p className="text-xs text-slate-500 font-medium">Single Transfer Limit</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</p>
            <p className="text-xs text-slate-500 font-medium">Balanced Double-Entry</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">&lt; 10ms</p>
            <p className="text-xs text-slate-500 font-medium">Simulated Settlement</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">256-bit</p>
            <p className="text-xs text-slate-500 font-medium">Password Encryption</p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineered for Modern Finance
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            From atomic ledger consistency to comprehensive analytics, explore the core capabilities of NEXBANK.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Atomic Internal Transfers
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Execute transfers with serializable isolation, overdraft prevention, and automatic idempotency key deduplication.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Double-Entry Accounting
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every fund movement creates synchronized credit and debit ledger entries, ensuring zero discrepancy and auditability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Granular Role Authorization
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete segregation of duties between customer self-service and administrative governance, account freezing, and reversals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Security-First Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bcrypt salted hashing, HttpOnly JWT cookies, strict rate limiting, Helmet HTTP headers, and centralized input validation with Zod.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              PDF & CSV Statements
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant download of official simulated bank statements formatted with PDFKit or exported to RFC-compliant CSV tables.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-5">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Customer Support Center
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Interactive ticketing workflow with real-time customer and administrator threaded communication and notification alerts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Answers to common questions regarding the educational simulation platform.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-blue-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight relative z-10">
            Ready to explore modern banking?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed relative z-10">
            Register in seconds and receive an instant simulated $1,000.00 opening balance to start testing transfers immediately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
            <Link
              to="/register"
              className="bg-white text-blue-900 font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-slate-100 transition"
            >
              Get Started Now
            </Link>
            <Link
              to="/contact"
              className="bg-blue-800/80 hover:bg-blue-800 text-white font-medium px-8 py-3.5 rounded-xl border border-blue-400/30 transition"
            >
              Submit an Enquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
