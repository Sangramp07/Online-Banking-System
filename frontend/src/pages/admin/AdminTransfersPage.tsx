import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  RotateCcw,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { Transfer } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const AdminTransfersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reversal Action Modal
  const [transferToReverse, setTransferToReverse] = useState<Transfer | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  // Transfer Inspection Modal
  const [inspectedTransfer, setInspectedTransfer] = useState<Transfer | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, [page, statusFilter]);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getTransfers({
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setTransfers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to load transfers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransfers();
  };

  const openReversalModal = (t: Transfer) => {
    setTransferToReverse(t);
    setReversalReason('');
    setIsReversalModalOpen(true);
  };

  const handleConfirmReversal = async () => {
    if (!transferToReverse || !reversalReason.trim()) {
      toastError('Please provide a documented reason for this financial reversal.');
      return;
    }
    setIsReversing(true);
    try {
      await AdminService.reverseTransfer(transferToReverse.id, reversalReason.trim());
      success(`Transfer ${transferToReverse.reference} reversed. Balanced clawback and refund executed.`);
      setIsReversalModalOpen(false);
      fetchTransfers();
    } catch (err: any) {
      toastError(err.message || 'Reversal failed.');
    } finally {
      setIsReversing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'REVERSED':
        return <Badge variant="warning">REVERSED</Badge>;
      case 'FAILED':
        return <Badge variant="danger">FAILED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Transfers & Audited Reversals
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Monitor all cross-account transfer flows and execute double-entry clawback reversals with strict audit trails.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by reference, description, or account number..."
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
              <option value="">All Transfer Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REVERSED">REVERSED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <Button type="submit" variant="primary">
            Filter
          </Button>
        </form>
      </div>

      {/* Transfers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Reference</th>
                <th className="p-4">From Account</th>
                <th className="p-4">To Account</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transfers found matching filter.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {t.reference}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      {t.sourceAccount?.accountNumber}
                      {t.sourceAccount?.customer?.fullName && (
                        <span className="block text-[10px] text-slate-400">
                          {t.sourceAccount.customer.fullName}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      {t.destinationAccount?.accountNumber}
                      {t.destinationAccount?.customer?.fullName && (
                        <span className="block text-[10px] text-slate-400">
                          {t.destinationAccount.customer.fullName}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-white max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="p-4">{getStatusBadge(t.status)}</td>
                    <td className="p-4 text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                      {formatINR(t.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setInspectedTransfer(t);
                            setIsInspectModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Inspect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {t.status === 'COMPLETED' && (
                          <button
                            onClick={() => openReversalModal(t)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition flex items-center gap-1"
                            title="Reverse Transfer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reverse
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} transfers)
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

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={isReversalModalOpen}
        onClose={() => setIsReversalModalOpen(false)}
        title="Execute Transfer Reversal"
        description={`Reference: ${transferToReverse?.reference}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            Financial Reversal: Claws back {formatINR(transferToReverse?.amount)} from destination account {transferToReverse?.destinationAccount?.accountNumber} and refunds source. Balanced reversal entries will be recorded.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reversal Reason (Mandatory for Audit Trail)
            </label>
            <textarea
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Duplicate transfer correction or customer disputed erroneous payment"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsReversalModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReversal}
              isLoading={isReversing}
              className="flex-1"
            >
              Confirm & Execute Reversal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspection Modal */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title={`Transfer Inspection — ${inspectedTransfer?.reference}`}
        description="Comprehensive audit record"
      >
        {inspectedTransfer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold">{inspectedTransfer.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                {getStatusBadge(inspectedTransfer.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {formatINR(inspectedTransfer.amount)} INR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Account:</span>
                <span className="font-mono">{inspectedTransfer.sourceAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Account:</span>
                <span className="font-mono">{inspectedTransfer.destinationAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span>{inspectedTransfer.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span>{new Date(inspectedTransfer.createdAt).toLocaleString()}</span>
              </div>
              {inspectedTransfer.reversalReason && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-rose-500">
                  <strong>Reversal Reason:</strong> {inspectedTransfer.reversalReason}
                </div>
              )}
            </div>

            <Button variant="primary" className="w-full" onClick={() => setIsInspectModalOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
