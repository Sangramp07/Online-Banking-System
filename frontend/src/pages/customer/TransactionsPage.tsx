import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  FileDown,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CustomerService } from '../../services/customer.service';
import { AccountService } from '../../services/account.service';
import { Account, TransactionEntry } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const TransactionsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [entries, setEntries] = useState<TransactionEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Transaction details modal
  const [selectedEntry, setSelectedEntry] = useState<TransactionEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    CustomerService.getMyAccounts().then((accs) => setAccounts(accs));
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, selectedAccountId, selectedType, startDate, endDate]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 12,
        search: searchQuery || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      let res;
      if (selectedAccountId !== 'all') {
        res = await AccountService.getAccountTransactions(selectedAccountId, params);
      } else {
        res = await AccountService.getAllTransactions(params);
      }

      setEntries(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleDownload = async (format: 'pdf' | 'csv') => {
    const targetAccountId = selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id;
    if (!targetAccountId) {
      toastError('Please select a specific account to download a statement.');
      return;
    }

    try {
      await AccountService.downloadStatement(
        targetAccountId,
        format,
        startDate || undefined,
        endDate || undefined
      );
      success(`Statement downloaded successfully in ${format.toUpperCase()} format.`);
    } catch (err: any) {
      toastError(err.message || 'Download failed.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transaction Ledger History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable balanced journal entries for all credits, debits, and transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload('csv')}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleDownload('pdf')}>
            <FileDown className="w-3.5 h-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search reference or description..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType} ({a.accountNumber.substring(a.accountNumber.length - 4)})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Types (Credit & Debit)</option>
              <option value="CREDIT">Credits Only (+)</option>
              <option value="DEBIT">Debits Only (-)</option>
            </select>
          </div>

          <Button type="submit" variant="primary" size="sm" className="w-full">
            Apply Filters
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-xs"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-xs"
          />
          {(startDate || endDate || searchQuery || selectedType !== 'all') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
                setSelectedType('all');
                setSelectedAccountId('all');
                setPage(1);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Description</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Balance After</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                entries.map((trx) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(trx);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(trx.createdAt).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(trx.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {trx.transfer?.reference || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-white max-w-xs truncate">
                      {trx.description}
                    </td>
                    <td className="p-4">
                      <Badge variant={trx.type === 'CREDIT' ? 'success' : 'danger'}>
                        {trx.type}
                      </Badge>
                    </td>
                    <td
                      className={`p-4 text-right font-black whitespace-nowrap text-sm ${
                        trx.type === 'CREDIT'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {trx.type === 'CREDIT' ? '+' : '-'}{formatINR(trx.amount)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatINR(trx.balanceAfter)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        className="p-1 text-slate-400 hover:text-blue-600 transition"
                        title="View details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} entries)
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

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Transaction Ledger Entry Details"
        description="Verified record from internal ledger"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Transfer Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedEntry.transfer?.reference || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Type:</span>
                <Badge variant={selectedEntry.type === 'CREDIT' ? 'success' : 'danger'}>
                  {selectedEntry.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedEntry.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span
                  className={`font-black text-sm ${
                    selectedEntry.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {selectedEntry.type === 'CREDIT' ? '+' : '-'}{formatINR(selectedEntry.amount)} INR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Balance After Transaction:</span>
                <span className="font-mono font-bold">
                  {formatINR(selectedEntry.balanceAfter)} INR
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span>{new Date(selectedEntry.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
