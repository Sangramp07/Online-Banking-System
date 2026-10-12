import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { AuditLog } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

export const AdminAuditLogsPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getAuditLogs({
        page,
        limit: 15,
        search: search || undefined,
        action: actionFilter || undefined,
      });
      setLogs(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Security & Administrative Audit Logs
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Immutable forensic log of critical operations, status adjustments, fund reversals, and authentications.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by action, actor, target, or reason..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-60">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="FUND_TRANSFER">FUND_TRANSFER</option>
              <option value="ADMIN_TRANSFER_REVERSAL">ADMIN_TRANSFER_REVERSAL</option>
              <option value="UPDATE_CUSTOMER_STATUS">UPDATE_CUSTOMER_STATUS</option>
              <option value="UPDATE_ACCOUNT_STATUS">UPDATE_ACCOUNT_STATUS</option>
              <option value="CUSTOMER_REGISTRATION">CUSTOMER_REGISTRATION</option>
            </select>
          </div>

          <Button type="submit" variant="primary">
            Search Logs
          </Button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Outcome</th>
                <th className="p-4">Reason / Details</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {log.actor?.email || 'System / Anonymous'}
                    </td>
                    <td className="p-4 text-slate-500">
                      {log.targetType || 'N/A'}
                    </td>
                    <td className="p-4">
                      <Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                        {log.outcome}
                      </Badge>
                    </td>
                    <td className="p-4 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                      {log.reason || log.details || '—'}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} logs)
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
    </div>
  );
};
