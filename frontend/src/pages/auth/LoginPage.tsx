import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'arjun.sharma@nexbank.demo',
      password: 'Customer@123456',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await login(data.email, data.password);
      success(`Welcome back, ${res.data.user.fullName}!`);

      if (res.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
      }
    } catch (err: any) {
      toastError(err.message || 'Invalid email address or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoUser = (role: 'customer' | 'admin', email: string, pass: string) => {
    setActiveTab(role);
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            NEXBANK
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign In to Your Banking Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter your credentials or choose a pre-configured demo account below.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Role Switcher Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSelectDemoUser('customer', 'arjun.sharma@nexbank.demo', 'Customer@123456')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'customer'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Customer Portal
          </button>
          <button
            type="button"
            onClick={() => handleSelectDemoUser('admin', 'admin@nexbank.demo', 'Admin@123456')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Console
          </button>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Instant Demo Logins:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDemoUser('customer', 'arjun.sharma@nexbank.demo', 'Customer@123456')}
              className="text-left px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 hover:border-blue-500 transition font-medium text-slate-700 dark:text-slate-300"
            >
              👤 Arjun Sharma <span className="block text-[9px] text-slate-400">Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemoUser('admin', 'admin@nexbank.demo', 'Admin@123456')}
              className="text-left px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 hover:border-amber-500 transition font-medium text-amber-700 dark:text-amber-300"
            >
              🛡️ System Admin <span className="block text-[9px] text-amber-400">Root Access</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-8 px-6 sm:px-8 shadow-xl rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex.morgan@nexbank.demo"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-slate-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In to Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Don't have a NEXBANK account?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Create one in 30 seconds
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
