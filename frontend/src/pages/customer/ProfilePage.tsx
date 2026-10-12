import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Save,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const profileSchema = z.object({
  fullName: z.string().min(2),
  mobileNumber: z.string().min(7),
  address: z.string().min(5),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include uppercase')
      .regex(/[a-z]/, 'Must include lowercase')
      .regex(/[0-9]/, 'Must include number'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      mobileNumber: user?.customer?.mobileNumber || '+1 415-555-0192',
      address: user?.customer?.address || '742 Evergreen Terrace, San Francisco, CA',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: any) => {
    setIsUpdatingProfile(true);
    try {
      await CustomerService.updateProfile(data);
      success('Personal details updated successfully.');
      await refreshUser();
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: any) => {
    setIsUpdatingPassword(true);
    try {
      await AuthService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmNewPassword
      );
      success('Password changed successfully.');
      resetPasswordForm();
    } catch (err: any) {
      toastError(err.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Customer Profile & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your personal details, credentials, and verification status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Verification Overview Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl mx-auto md:mx-0 shadow-md shadow-blue-500/20">
            {user?.fullName?.charAt(0) || 'C'}
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {user?.fullName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {user?.customerNumber}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>KYC Status:</span>
              <Badge variant="success">VERIFIED</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Account Status:</span>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Member Since:</span>
              <span>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Update Personal Information */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Personal Information
            </h3>

            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4" />}
                  {...registerProfile('fullName')}
                />
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Primary email cannot be changed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mobile Phone"
                  leftIcon={<Phone className="w-4 h-4" />}
                  {...registerProfile('mobileNumber')}
                />
                <Input
                  label="Residential Address"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  {...registerProfile('address')}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-500" />
              Update Password
            </h3>

            <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.currentPassword?.message as string}
                {...registerPassword('currentPassword')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.newPassword?.message as string}
                  {...registerPassword('newPassword')}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.confirmNewPassword?.message as string}
                  {...registerPassword('confirmNewPassword')}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="secondary" isLoading={isUpdatingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
