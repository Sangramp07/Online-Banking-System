import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wallet,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  LifeBuoy,
  ShieldCheck,
  TrendingUp,
  Download,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { AdminService } from '../../services/admin.service';
import { DashboardMetrics } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export const AdminDashboardPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getDashboard();
      setData(res);
    } catch (err: any) {
      toastError(err.message || 'Failed to load admin metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = data?.metrics;
  const chartData = data?.charts?.monthlyVolume || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Administrative Control Center
            </h1>
            <Badge variant="warning">ADMIN PRIVILEGED</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time oversight of system accounts, liquidity volume, audit trails, and customer access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5" />
              Export System Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          subtitle={`${metrics?.activeCustomers || 0} active profiles`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Simulated Volume"
          value={formatINR(metrics?.totalSimulatedVolume || 0)}
          subtitle={`${metrics?.completedTransfers || 0} completed transfers`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Bank Accounts"
          value={metrics?.totalAccounts || 0}
          subtitle={`${metrics?.restrictedAccounts || 0} restricted/frozen`}
          icon={Wallet}
          color="purple"
        />
        <StatCard
          title="Open Support Tickets"
          value={metrics?.openTickets || 0}
          subtitle={`${metrics?.failedTransfers || 0} failed transfers`}
          icon={LifeBuoy}
          color="amber"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulated Transaction Volume ($ USD)
              </h3>
              <p className="text-xs text-slate-400">Monthly cleared transfer values</p>
            </div>
            <Badge variant="success">Monthly Growth</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
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
                <Bar dataKey="volume" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Transfer Velocity & Activity
              </h3>
              <p className="text-xs text-slate-400">Total transfers processed by period</p>
            </div>
            <Badge variant="info">Throughput</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
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
                  dataKey="count"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Double Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Customer Registrations
            </h3>
            <Link
              to="/admin/customers"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View directory →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {data?.recentRegistrations?.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.fullName}</p>
                  <p className="text-[11px] text-slate-400">{c.user?.email}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-500 font-semibold">{c.customerNumber}</span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent System Transfers
            </h3>
            <Link
              to="/admin/transfers"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Monitor all transfers →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {data?.recentTransfers?.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{t.reference}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {t.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {formatINR(t.amount)}
                  </span>
                  <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'} className="ml-2">
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
