import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LifeBuoy,
  PlusCircle,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
} from 'lucide-react';
import { SupportService } from '../../services/support.service';
import { SupportTicket, SupportMessage } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(2, 'Please select a category'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export const SupportPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New ticket modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Active ticket conversation view
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'General Banking',
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await SupportService.getTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (data: TicketFormData) => {
    setIsSubmittingTicket(true);
    try {
      const newTicket = await SupportService.createTicket(data);
      success('Support ticket opened successfully.');
      setIsNewTicketModalOpen(false);
      reset();
      await fetchTickets();
      setSelectedTicket(newTicket);
    } catch (err: any) {
      toastError(err.message || 'Failed to create support ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      const sentMsg = await SupportService.addMessage(selectedTicket.id, replyMessage.trim());
      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...(prev.messages || []), sentMsg] } : prev
      );
      setReplyMessage('');
      success('Message sent to support team.');
      fetchTickets();
    } catch (err: any) {
      toastError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="info">OPEN</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">IN PROGRESS</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">RESOLVED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customer Support Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Open inquiries, resolve technical issues, or inquire about transaction limits.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsNewTicketModalOpen(true)}>
          <PlusCircle className="w-4 h-4" />
          Open New Ticket
        </Button>
      </div>

      {/* Main Grid: Ticket List + Message Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            My Support Tickets ({tickets.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No tickets open. Click "Open New Ticket" above.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-500">{t.ticketNumber}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {t.subject}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t.category}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread Column */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px]">
              {/* Thread Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-600">
                      {selectedTicket.ticketNumber}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-xs text-slate-400">• Priority: {selectedTicket.priority}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-xl ${
                      msg.isAdminReply ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.isAdminReply
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {msg.isAdminReply ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs space-y-1 ${
                        msg.isAdminReply
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                        <span className="font-bold">
                          {msg.isAdminReply ? 'NEXBANK Support Agent' : 'You'}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-2xl">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response to support..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSendReply}
                    isLoading={isSendingReply}
                    disabled={!replyMessage.trim()}
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[600px] flex items-center justify-center text-slate-400 text-xs">
              Select a ticket on the left to view the message thread.
            </div>
          )}
        </div>
      </div>

      {/* Open Ticket Modal */}
      <Modal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        title="Open Support Ticket"
        description="Describe your request and our support desk will respond"
      >
        <form onSubmit={handleSubmit(handleCreateTicket)} className="space-y-4">
          <Input
            label="Subject"
            placeholder="e.g. Question about daily transfer limit"
            error={errors.subject?.message}
            {...register('subject')}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                {...register('category')}
              >
                <option value="General Banking">General Banking</option>
                <option value="Transfers & Payments">Transfers & Payments</option>
                <option value="Account Limits">Account Limits</option>
                <option value="Security Inquiry">Security Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Message
            </label>
            <textarea
              rows={4}
              placeholder="Explain the issue in detail..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            className="w-full mt-2"
            isLoading={isSubmittingTicket}
          >
            Submit Ticket
          </Button>
        </form>
      </Modal>
    </div>
  );
};
