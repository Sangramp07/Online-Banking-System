import React, { useState, useEffect } from 'react';
import {
  Wallet,
  FileDown,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Download,
} from 'lucide-react';
import { CustomerService } from '../../services/customer.service';
import { AccountService } from '../../services/account.service';
import { Account, TransactionEntry } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const AccountsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedAccounts, setRevealedAccounts] = useState<Record<string, boolean>>({});

  // Statement modal state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Account details / transactions view modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [accountTransactions, setAccountTransactions] = useState<TransactionEntry[]>([]);
  const [isLoadingTrx, setIsLoadingTrx] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await CustomerService.getMyAccounts();
      setAccounts(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(accountNumber);
    success('Account number copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenStatementModal = (acc: Account) => {
    setSelectedAccount(acc);
    setIsStatementModalOpen(true);
  };

  const handleDownload = async (format: 'pdf' | 'csv') => {
    if (!selectedAccount) return;
    setIsDownloading(true);
    try {
      await AccountService.downloadStatement(
        selectedAccount.id,
        format,
        startDate || undefined,
        endDate || undefined
      );
      success(`Statement downloaded successfully in ${format.toUpperCase()} format.`);
      setIsStatementModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewDetails = async (acc: Account) => {
    setSelectedAccount(acc);
    setIsDetailsModalOpen(true);
    setIsLoadingTrx(true);
    try {
      const res = await AccountService.getAccountTransactions(acc.id, { limit: 20 });
      setAccountTransactions(res.data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load transactions.');
    } finally {
      setIsLoadingTrx(false);
    }
  };

  const formatMasked = (accNum: string, isRevealed: boolean) => {
    if (isRevealed) return accNum;
    if (accNum.length <= 6) return accNum;
    return `${accNum.substring(0, 4)}••••••${accNum.substring(accNum.length - 4)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Account Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View balances, manage account privileges, and download official statements.
          </p>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => {
          const isRevealed = !!revealedAccounts[acc.id];
          return (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-6"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {acc.accountType} ACCOUNT
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Opened {new Date(acc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {acc.status}
                </Badge>
              </div>

              {/* Account Number Strip */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Account Number
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                    {formatMasked(acc.accountNumber, isRevealed)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleReveal(acc.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                    title={isRevealed ? 'Mask' : 'Reveal'}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleCopy(acc.accountNumber)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                    title="Copy full number"
                  >
                    {copiedId === acc.accountNumber ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-400">
                    Available Balance
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {formatINR(acc.balance)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Ledger Balance
                  </span>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {formatINR(acc.ledgerBalance)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(acc)}
                  className="flex-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Activity
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenStatementModal(acc)}
                  className="flex-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Get Statement
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Statement Download Modal */}
      <Modal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        title="Download Official Statement"
        description={`Export statement for account ${selectedAccount?.accountNumber}`}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs rounded-xl p-2.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-500 leading-relaxed">
            Choose your preferred export format. Statements generated are official simulation documents containing verified ledger entries.
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => handleDownload('pdf')}
              isLoading={isDownloading}
              className="w-full"
            >
              <FileDown className="w-4 h-4 mr-1" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('csv')}
              isLoading={isDownloading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-1" />
              Download CSV
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Account Activity — ${selectedAccount?.accountNumber}`}
        description="Detailed transaction entries for this account"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {isLoadingTrx ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading ledger...</div>
          ) : accountTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No activity recorded.</div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {accountTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono font-semibold">
                        {t.transfer?.reference || 'N/A'}
                      </td>
                      <td className="p-3 max-w-xs truncate">{t.description}</td>
                      <td className="p-3">
                        <Badge variant={t.type === 'CREDIT' ? 'success' : 'danger'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          t.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {t.type === 'CREDIT' ? '+' : '-'}{formatINR(t.amount)}
                      </td>
                      <td className="p-3 text-right font-mono">{formatINR(t.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
