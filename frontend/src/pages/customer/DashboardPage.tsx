import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Users,
  History,
  FileDown,
  ShieldCheck,
  Send,
  PlusCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { CustomerService } from '../../services/customer.service';
import { AccountService } from '../../services/account.service';
import { Account, TransactionEntry } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [accList, trxData] = await Promise.all([
          CustomerService.getMyAccounts(),
          AccountService.getAllTransactions({ limit: 6 }),
        ]);
        setAccounts(accList);
        setTransactions(trxData.data || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  );

  const totalCredits = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const handleCopy = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(accNum);
    success('Account number copied to clipboard.');
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // Mock activity chart data generated from accounts & transactions
  const chartData = [
    { name: 'Mon', income: 1200, expense: 450 },
    { name: 'Tue', income: 800, expense: 900 },
    { name: 'Wed', income: 2500, expense: 300 },
    { name: 'Thu', income: 950, expense: 1200 },
    { name: 'Fri', income: 3400, expense: 800 },
    { name: 'Sat', income: 600, expense: 400 },
    { name: 'Sun', income: 1500, expense: 650 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Account Identity Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Demo Profile • Customer #{user?.customerNumber || 'CUST-80214'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.fullName || 'Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Welcome to your personal digital banking console. Your accounts are protected with serializable transactional isolation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/transfers"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              Transfer Funds
            </Link>
            <Link
              to="/beneficiaries"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-3 rounded-xl border border-white/20 transition active:scale-95"
            >
              <Users className="w-4 h-4" />
              Beneficiaries
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Available Balance"
          value={formatINR(totalBalance)}
          subtitle="Across all active accounts"
          icon={Wallet}
          color="blue"
          trend={{ value: '+4.5% APY', isPositive: true }}
        />
        <StatCard
          title="Total Recent Credits"
          value={formatINR(totalCredits)}
          subtitle="Incoming deposits"
          icon={ArrowDownLeft}
          color="emerald"
          trend={{ value: 'Inflow', isPositive: true }}
        />
        <StatCard
          title="Total Recent Debits"
          value={formatINR(totalDebits)}
          subtitle="Transfers and payouts"
          icon={ArrowUpRight}
          color="amber"
          trend={{ value: 'Outflow', isPositive: false }}
        />
        <StatCard
          title="Active Accounts"
          value={accounts.length.toString()}
          subtitle="Savings & Checking"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Primary Account Quick Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            My Accounts Summary
          </h2>
          <Link
            to="/accounts"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all account statements →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    {acc.accountType} ACCOUNT
                  </span>
                  <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {acc.status}
                  </Badge>
                </div>
                <button
                  onClick={() => handleCopy(acc.accountNumber)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 font-mono transition"
                  title="Copy account number"
                >
                  <span>{acc.accountNumber}</span>
                  {copiedAccount === acc.accountNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Available Balance
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatINR(acc.balance)}{' '}
                  <span className="text-sm font-semibold text-slate-400">INR</span>
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Ledger Balance: {formatINR(acc.ledgerBalance)}</span>
                <Link
                  to={`/accounts`}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Download Statement
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cash Flow Overview (Credits vs Debits)
              </h3>
              <p className="text-xs text-slate-400">Weekly simulated liquidity activity</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Credit
              </span>
              <span className="flex items-center gap-1 text-blue-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Debit
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Activity Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Account Velocity Trend
              </h3>
              <p className="text-xs text-slate-400">Simulated moving balances over time</p>
            </div>
            <Badge variant="info">Live Tracking</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500">Atomic ledger records</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all history →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(trx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {trx.transfer?.reference || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white max-w-xs truncate">
                      {trx.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={trx.type === 'CREDIT' ? 'success' : 'danger'}>
                        {trx.type}
                      </Badge>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                        trx.type === 'CREDIT'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {trx.type === 'CREDIT' ? '+' : '-'}{formatINR(trx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                      {formatINR(trx.balanceAfter)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
