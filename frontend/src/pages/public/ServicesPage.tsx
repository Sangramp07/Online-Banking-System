import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowRightLeft,
  History,
  FileDown,
  Users,
  Headphones,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const services = [
    {
      icon: Wallet,
      title: 'Digital Account Management',
      desc: 'Instant provisioning of Savings and Current checking accounts with unique masked account numbers, real-time available and ledger balance tracking, and status controls.',
      highlights: ['Instant opening with $1,000 demo credit', 'Masked account confidentiality', 'Savings and checking support'],
    },
    {
      icon: ArrowRightLeft,
      title: 'Simulated Instant Fund Transfers',
      desc: 'Seamless transfers between internal NEXBANK accounts with atomic double-entry debit and credit ledger operations, zero overdraft risk, and real-time receipts.',
      highlights: ['Serializable transaction isolation', 'Idempotency key duplicate protection', 'Configurable per-transfer limits'],
    },
    {
      icon: History,
      title: 'Real-Time Transaction Tracking',
      desc: 'Comprehensive search, multi-criteria filtering by date range, account, type, and status with server-side pagination and detailed modal receipts.',
      highlights: ['Real-time balance after transaction', 'Universal search by reference', 'Filter by Credit/Debit type'],
    },
    {
      icon: FileDown,
      title: 'Official Statement Generation',
      desc: 'Generate and download official simulated bank statements on demand in PDF format (formatted with PDFKit) or exported as CSV tables for financial spreadsheet analysis.',
      highlights: ['Instant PDF download', 'RFC-compliant CSV exports', 'Date-range customized exports'],
    },
    {
      icon: Users,
      title: 'Beneficiary Management',
      desc: 'Register frequent internal transfer recipients with destination account validation, custom nicknames, and verification badges to streamline repeat transfers.',
      highlights: ['Instant destination account check', 'Custom nickname tags', 'One-click transfer shortcuts'],
    },
    {
      icon: Headphones,
      title: '24/7 Priority Customer Support',
      desc: 'Interactive integrated support ticketing system enabling customer-to-administrator threaded messaging, ticket priority status tracking, and notification updates.',
      highlights: ['Threaded conversation timeline', 'Categorized ticket priority', 'Instant resolution status updates'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Comprehensive Banking Services
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Explore all the functional simulation modules built into NEXBANK, from transactional ledgers to automated statement engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>

                <div className="pt-2 space-y-2">
                  {s.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  to="/login"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 inline-flex items-center gap-1.5"
                >
                  Test In Demo <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition"
        >
          Create Your Demo Account Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
