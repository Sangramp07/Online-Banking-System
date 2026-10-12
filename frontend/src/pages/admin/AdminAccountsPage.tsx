import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { Account } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const AdminAccountsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change Modal
  const [accountToUpdate, setAccountToUpdate] = useState<Account | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('FROZEN');
  const [auditReason, setAuditReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [page, statusFilter]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAccounts({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setAccounts(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to load accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAccounts();
  };

  const openStatusModal = (acc: Account, status: string) => {
    setAccountToUpdate(acc);
    setTargetStatus(status);
    setAuditReason('');
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!accountToUpdate || !auditReason.trim()) {
      toastError('An administrative audit reason is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await AdminService.updateAccountStatus(
        accountToUpdate.id,
        targetStatus,
        auditReason.trim()
      );
      success(`Account ${accountToUpdate.accountNumber} status set to ${targetStatus}. Recorded in audit log.`);
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      toastError(err.message || 'Failed to update account status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'FROZEN':
        return <Badge variant="danger">FROZEN</Badge>;
      case 'RESTRICTED':
        return <Badge variant="warning">RESTRICTED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Privilege & Risk Controls
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Monitor all simulated accounts, freeze or restrict suspicious accounts, and inspect ledger balances.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by account number or customer name..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="">All Account Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="FROZEN">FROZEN</option>
            </select>
          </div>

          <Button type="submit" variant="primary">
            Filter
          </Button>
        </form>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Account Number</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Available Balance</th>
                <th className="p-4 text-right">Ledger Balance</th>
                <th className="p-4 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No accounts found matching filter.
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {a.accountNumber}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {a.customer?.fullName}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{a.accountType}</span>
                    </td>
                    <td className="p-4">{getStatusBadge(a.status)}</td>
                    <td className="p-4 text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                      {formatINR(a.balance)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {formatINR(a.ledgerBalance)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {a.status !== 'ACTIVE' && (
                          <button
                            onClick={() => openStatusModal(a, 'ACTIVE')}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 text-[11px] font-semibold hover:bg-emerald-100"
                          >
                            Unfreeze / Activate
                          </button>
                        )}
                        {a.status !== 'RESTRICTED' && (
                          <button
                            onClick={() => openStatusModal(a, 'RESTRICTED')}
                            className="px-2 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 text-[11px] font-semibold hover:bg-amber-100"
                          >
                            Restrict
                          </button>
                        )}
                        {a.status !== 'FROZEN' && (
                          <button
                            onClick={() => openStatusModal(a, 'FROZEN')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 text-[11px] font-semibold hover:bg-rose-100"
                          >
                            Freeze
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} accounts)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Account Status Control Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Set Account Status: ${targetStatus}`}
        description={`Account Number: ${accountToUpdate?.accountNumber}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Modifying account privilege prevents or permits future debits and transfers. An immutable entry will be recorded in the security audit log.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Administrative Change (Required for Audit Log)
            </label>
            <textarea
              rows={3}
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Account frozen due to flagged anomalous withdrawal velocity"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant={targetStatus === 'ACTIVE' ? 'primary' : 'danger'}
              onClick={handleConfirmStatusChange}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Apply Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
