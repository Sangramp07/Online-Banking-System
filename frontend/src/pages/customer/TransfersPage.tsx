import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRightLeft,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { CustomerService } from '../../services/customer.service';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { TransferService } from '../../services/transfer.service';
import { Account, Beneficiary } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

const transferFormSchema = z.object({
  sourceAccountId: z.string().min(1, 'Please select a source account'),
  destinationAccountNumber: z.string().min(5, 'Destination account number is required'),
  amount: z
    .number({ invalid_type_error: 'Please enter a valid amount' })
    .positive('Amount must be greater than zero')
    .max(1000000, 'Single transfer limit is ₹10,00,000'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(120),
});

type TransferFormData = z.infer<typeof transferFormSchema>;

export const TransfersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Transfer flow states
  const [formDataToConfirm, setFormDataToConfirm] = useState<TransferFormData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
  });

  const selectedSourceId = watch('sourceAccountId');
  const watchedAmount = watch('amount');

  const selectedSourceAccount = accounts.find((a) => a.id === selectedSourceId);
  const availableBalance = selectedSourceAccount ? Number(selectedSourceAccount.balance) : 0;
  const isInsufficient = watchedAmount ? watchedAmount > availableBalance : false;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accs, bens] = await Promise.all([
        CustomerService.getMyAccounts(),
        BeneficiaryService.getBeneficiaries(),
      ]);
      setAccounts(accs);
      setBeneficiaries(bens);
      if (accs.length > 0) {
        setValue('sourceAccountId', accs[0].id);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to initialize transfer module.');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleSelectBeneficiary = (b: Beneficiary) => {
    setValue('destinationAccountNumber', b.accountNumber);
  };

  const handleQuickAmount = (val: number) => {
    setValue('amount', val);
  };

  const onPreSubmit = (data: TransferFormData) => {
    if (data.amount > availableBalance) {
      toastError(
        `Insufficient funds. Available balance is ${formatINR(availableBalance)}, requested ${formatINR(data.amount)}.`
      );
      return;
    }
    setFormDataToConfirm(data);
    setIsConfirmModalOpen(true);
  };

  const executeConfirmedTransfer = async () => {
    if (!formDataToConfirm) return;
    setIsProcessing(true);
    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = await TransferService.executeTransfer({
        ...formDataToConfirm,
        idempotencyKey,
      });

      setIsConfirmModalOpen(false);
      setReceiptData(result.data);
      setIsReceiptModalOpen(true);
      success('Funds transferred successfully!');

      // Refresh accounts balances
      const updatedAccounts = await CustomerService.getMyAccounts();
      setAccounts(updatedAccounts);

      reset({
        sourceAccountId: formDataToConfirm.sourceAccountId,
        destinationAccountNumber: '',
        amount: undefined,
        description: '',
      });
    } catch (err: any) {
      toastError(err.message || 'Transfer failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Simulated Fund Transfer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Transfer demo funds instantly with atomic serializable consistency and balanced ledger verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
              {/* 1. Source Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  From Account
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  {...register('sourceAccountId')}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountType} — {acc.accountNumber} ({formatINR(acc.balance)} INR)
                    </option>
                  ))}
                </select>
                {selectedSourceAccount && (
                  <p className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
                    <span>Available to transfer:</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold">
                      {formatINR(availableBalance)} INR
                    </strong>
                  </p>
                )}
              </div>

              {/* 2. Destination Account */}
              <div>
                <Input
                  label="Destination Account Number"
                  placeholder="e.g. NEX-10074912"
                  error={errors.destinationAccountNumber?.message}
                  {...register('destinationAccountNumber')}
                />

                {/* Beneficiary Quick Picker Chips */}
                {beneficiaries.length > 0 && (
                  <div className="mt-3">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Or select saved beneficiary:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {beneficiaries.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleSelectBeneficiary(b)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 transition font-medium flex items-center gap-1.5"
                        >
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{b.nickname || b.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({b.accountNumber.substring(b.accountNumber.length - 4)})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Amount */}
              <div>
                <Input
                  label="Transfer Amount (₹ INR)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={
                    errors.amount?.message ||
                    (isInsufficient ? 'Amount exceeds available balance' : undefined)
                  }
                  {...register('amount', { valueAsNumber: true })}
                />

                {/* Quick Amount Chips */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Quick amount:</span>
                  {[500, 1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Description */}
              <Input
                label="Transfer Purpose / Description"
                placeholder="e.g. Monthly rent, invoice settlement"
                error={errors.description?.message}
                {...register('description')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isInsufficient}
              >
                Review and Confirm Transfer
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </div>

        {/* Transfer Safety & Ledger Notice Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Financial Integrity Rules
            </div>

            <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Balanced Double-Entry:</strong> Source is debited and destination is credited in the same microsecond.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>No Overdrafts:</strong> Balances are locked and strictly validated server-side.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Idempotency Guard:</strong> Retries with identical keys never duplicate charges.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Step Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Fund Transfer"
        description="Please verify the transfer details before executing"
      >
        {formDataToConfirm && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">From Account:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedSourceAccount?.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">To Account:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formDataToConfirm.destinationAccountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formDataToConfirm.description}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Amount:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {formatINR(formDataToConfirm.amount)} INR
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={executeConfirmedTransfer}
                isLoading={isProcessing}
                className="flex-1"
              >
                Execute Transfer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Transaction Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Transfer Completed Successfully"
        description="Official simulated transaction receipt"
      >
        {receiptData && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <FileCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400">Total Transferred</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {formatINR(receiptData.amount)} INR
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {receiptData.reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Account:</span>
                <span className="font-mono font-bold">{receiptData.destinationAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Holder:</span>
                <span className="font-medium">{receiptData.destinationHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Account:</span>
                <span className="font-mono font-medium">{receiptData.sourceAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span>{new Date(receiptData.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsReceiptModalOpen(false)}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
