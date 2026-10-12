import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Trash2,
  Send,
  Building2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { Beneficiary } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const addBeneficiarySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  accountNumber: z.string().min(5, 'Account number is required'),
  bankName: z.string().default('NEXBANK'),
  routingNumber: z.string().default('021000021'),
  nickname: z.string().optional(),
});

type AddBeneficiaryFormData = z.infer<typeof addBeneficiarySchema>;

export const BeneficiariesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBeneficiaryFormData>({
    resolver: zodResolver(addBeneficiarySchema),
    defaultValues: {
      bankName: 'NEXBANK',
      routingNumber: '021000021',
    },
  });

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    setIsLoading(true);
    try {
      const data = await BeneficiaryService.getBeneficiaries();
      setBeneficiaries(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch beneficiaries.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (data: AddBeneficiaryFormData) => {
    setIsSubmitting(true);
    try {
      await BeneficiaryService.addBeneficiary(data);
      success('Beneficiary added successfully.');
      setIsAddModalOpen(false);
      reset();
      fetchBeneficiaries();
    } catch (err: any) {
      toastError(err.message || 'Failed to add beneficiary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      await BeneficiaryService.deleteBeneficiary(id);
      success('Beneficiary removed.');
      fetchBeneficiaries();
    } catch (err: any) {
      toastError(err.message || 'Failed to remove beneficiary.');
    }
  };

  const filtered = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Beneficiary Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your verified transfer contacts for rapid 1-click payments.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Add Beneficiary
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search by name, nickname, or account..."
          leftIcon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Beneficiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No beneficiaries found</p>
            <p className="text-xs mt-1">Add a new recipient to quickly transfer money.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {b.nickname ? `${b.nickname} (${b.name})` : b.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{b.bankName}</p>
                    </div>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Account Number
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {b.accountNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate('/transfers')}
                >
                  <Send className="w-3.5 h-3.5" />
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(b.id)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Beneficiary Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Beneficiary"
        description="Register a verified recipient account"
      >
        <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
          <Input
            label="Beneficiary Full Name"
            placeholder="Sarah Jenkins"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="NEXBANK Account Number"
            placeholder="e.g. NEX-10074912"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />
          <Input
            label="Custom Nickname (Optional)"
            placeholder="e.g. Sarah Design Lead"
            error={errors.nickname?.message}
            {...register('nickname')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bank Name"
              readOnly
              disabled
              {...register('bankName')}
            />
            <Input
              label="Routing Number"
              readOnly
              disabled
              {...register('routingNumber')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Save Beneficiary
          </Button>
        </form>
      </Modal>
    </div>
  );
};
