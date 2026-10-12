import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { Customer } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const AdminCustomersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change Modal
  const [customerToUpdate, setCustomerToUpdate] = useState<Customer | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // View Customer Details Modal
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getCustomers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setCustomers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to load customers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const openStatusChangeModal = (customer: Customer, targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    setCustomerToUpdate(customer);
    setNewStatus(targetStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!customerToUpdate || !statusReason.trim()) {
      toastError('Please provide an administrative reason for the audit log.');
      return;
    }
    setIsSubmittingStatus(true);
    try {
      await AdminService.updateCustomerStatus(
        customerToUpdate.id,
        newStatus,
        statusReason.trim()
      );
      success(`Customer profile marked as ${newStatus}. Reason recorded in audit log.`);
      setIsStatusModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toastError(err.message || 'Status change failed.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Customer Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inspect registered customers, review KYC status, and enforce account suspensions with audited reasons.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by customer name, customer number, or email..."
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
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <Button type="submit" variant="primary">
            Filter
          </Button>
        </form>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Customer ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Status</th>
                <th className="p-4">Accounts</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c.customerNumber}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {c.fullName}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {c.user?.email}
                    </td>
                    <td className="p-4 text-slate-500">{c.mobileNumber}</td>
                    <td className="p-4">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">{c.accounts?.length || 0} account(s)</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setViewCustomer(c);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => openStatusChangeModal(c, 'SUSPENDED')}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => openStatusChangeModal(c, 'ACTIVE')}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 transition"
                          >
                            Activate
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} customers)
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

      {/* Customer Status Change Modal (Mandatory Audit Reason) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`${newStatus === 'ACTIVE' ? 'Activate' : 'Suspend'} Customer Access`}
        description={`Customer: ${customerToUpdate?.fullName} (${customerToUpdate?.customerNumber})`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Administrative action warning: Changing customer status will immediately toggle login access and will be recorded in the security audit logs.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Status Change (Required for Audit Log)
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="e.g. Account suspended pending fraud investigation or terms compliance"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={newStatus === 'ACTIVE' ? 'primary' : 'danger'}
              onClick={handleConfirmStatusChange}
              isLoading={isSubmittingStatus}
              className="flex-1"
            >
              Confirm {newStatus}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Customer Details — ${viewCustomer?.fullName}`}
        description={`Identifier: ${viewCustomer?.customerNumber}`}
        maxWidth="lg"
      >
        {viewCustomer && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewCustomer.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span>{viewCustomer.mobileNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date of Birth:</span>
                <span>{viewCustomer.dateOfBirth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span>{viewCustomer.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge variant={viewCustomer.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {viewCustomer.status}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                Associated Accounts
              </h4>
              <div className="space-y-2">
                {viewCustomer.accounts?.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {acc.accountNumber}
                      </span>
                      <span className="text-slate-400 ml-2">({acc.accountType})</span>
                    </div>
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {formatINR(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
