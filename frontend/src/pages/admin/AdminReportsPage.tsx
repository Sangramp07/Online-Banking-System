import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Users,
  Wallet,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export const AdminReportsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleExport = async (type: 'transfers' | 'customers' | 'accounts') => {
    setDownloadingType(type);
    try {
      await AdminService.exportReport(type);
      success(`${type.toUpperCase()} report exported successfully to CSV.`);
    } catch (err: any) {
      toastError(err.message || 'Report export failed.');
    } finally {
      setDownloadingType(null);
    }
  };

  const reports = [
    {
      id: 'transfers' as const,
      title: 'Transfers & Ledger Activity Report',
      desc: 'Complete log of all internal transfers including references, source and destination accounts, amounts, settlement timestamps, and status.',
      icon: ArrowRightLeft,
      color: 'blue',
    },
    {
      id: 'customers' as const,
      title: 'Customer Profiles & Growth Report',
      desc: 'Detailed directory of registered customer accounts, verification tiers, email records, phone numbers, and associated account counts.',
      icon: Users,
      color: 'emerald',
    },
    {
      id: 'accounts' as const,
      title: 'Depository Accounts & Liquidity Report',
      desc: 'Full breakdown of active, restricted, and frozen Savings and Current accounts with ledger balances and currency denominations.',
      icon: Wallet,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reports & Financial Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generate comprehensive audit-ready CSV exports directly from live MySQL database records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {r.desc}
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => handleExport(r.id)}
                isLoading={downloadingType === r.id}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV Report
              </Button>
            </div>
          );
        })}
      </div>

      {/* Compliance Information Box */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Reporting Standards & Data Integrity
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          All reports pull directly from live indexed MySQL tables. Sensitive fields such as password hashes are strictly redacted by backend Data Transfer Objects (DTOs). Exported CSVs are RFC4180 compliant and suitable for import into spreadsheet suites.
        </p>
      </div>
    </div>
  );
};
