import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, CheckCircle2, Building2 } from 'lucide-react';
import { SupportService } from '../../services/support.service';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await SupportService.submitContactEnquiry(data);
      setIsSubmitted(true);
      success('Thank you! Your enquiry has been saved to the database.');
      reset();
    } catch (err: any) {
      toastError(err.message || 'Failed to submit enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact NEXBANK
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Have questions about the platform, integration simulations, or architecture? Drop us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Simulation Headquarter
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Financial District, Suite 500<br />San Francisco, CA 94104</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>support@nexbank.demo</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>+1 (800) 555-NEXBANK</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300">
              Demo System Inquiries
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              All messages submitted through this form are stored in the MySQL database table <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-[11px] font-mono">contact_enquiries</code>.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Enquiry Submitted Successfully!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your inquiry has been recorded into the NEXBANK database. Our simulated representative will review it shortly.
                </p>
                <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <Input
                  label="Subject"
                  placeholder="Inquiry regarding API simulation"
                  error={errors.subject?.message}
                  {...register('subject')}
                />

                <div className="w-full">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Provide details about your query..."
                    className={`w-full bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-white rounded-xl text-sm transition p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      errors.message
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-800'
                    }`}
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  isLoading={isSubmitting}
                >
                  <Send className="w-4 h-4" />
                  Submit Support Enquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
