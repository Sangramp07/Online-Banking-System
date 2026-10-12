import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  ArrowRight,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobileNumber: z.string().regex(/^\+?[0-9\s-]{7,15}$/, 'Valid phone number required'),
    dateOfBirth: z.string().min(8, 'Date of birth is required'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      dateOfBirth: '1995-05-20',
      address: '100 Financial Plaza, San Francisco, CA',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await registerUser(data);
      success(`Welcome to NEXBANK! Account opened with $1,000.00 demo bonus.`);
      navigate('/dashboard');
    } catch (err: any) {
      toastError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            NEXBANK
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Open a Simulated Online Banking Account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Experience frictionless onboarding with automatic verified account creation.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Welcome Incentive Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 mb-6 shadow-md flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Welcome Demo Bonus</h4>
            <p className="text-xs text-emerald-50">
              New accounts automatically receive a verified Savings account with <strong className="underline">$1,000.00 USD</strong> in simulated funds!
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-8 px-6 sm:px-10 shadow-xl rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                placeholder="Jane Doe"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Phone"
                placeholder="+1 555-0199"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.mobileNumber?.message}
                {...register('mobileNumber')}
              />
              <Input
                label="Date of Birth"
                type="date"
                leftIcon={<Calendar className="w-4 h-4" />}
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>

            <Input
              label="Residential Address"
              placeholder="123 Financial Way, Suite 400"
              leftIcon={<MapPin className="w-4 h-4" />}
              error={errors.address?.message}
              {...register('address')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  {...register('acceptTerms')}
                />
                <span>
                  I understand that NEXBANK is an educational banking simulation. All funds and transactions are fictional demo records.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Open My Account Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
