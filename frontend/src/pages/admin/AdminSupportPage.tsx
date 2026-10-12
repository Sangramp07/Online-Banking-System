import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Send,
  User,
  Shield,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminService } from '../../services/admin.service';
import { SupportService } from '../../services/support.service';
import { SupportTicket } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

export const AdminSupportPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Active ticket
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getTickets({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setTickets(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      if (res.data?.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data[0]);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
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
      success('Reply sent to customer.');
      fetchTickets();
    } catch (err: any) {
      toastError(err.message || 'Failed to send reply.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      await AdminService.updateTicketStatus(selectedTicket.id, status);
      setSelectedTicket((prev) => (prev ? { ...prev, status: status as any } : prev));
      success(`Ticket status updated to ${status}.`);
      fetchTickets();
    } catch (err: any) {
      toastError(err.message || 'Failed to update ticket status.');
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Support Ticket Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review customer inquiries, send administrative answers, and manage resolution lifecycles.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket Queue
            </h3>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-[11px] rounded-lg p-1.5 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No tickets in queue.
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
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
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
                      <span>{t.customer?.fullName}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-amber-600">
                      {selectedTicket.ticketNumber}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-xs text-slate-400">
                      Customer: <strong>{selectedTicket.customer?.fullName}</strong> ({selectedTicket.customer?.customerNumber})
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'RESOLVED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="text-emerald-600"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    >
                      Reopen Ticket
                    </Button>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-xl ${
                      msg.isAdminReply ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.isAdminReply
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {msg.isAdminReply ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs space-y-1 ${
                        msg.isAdminReply
                          ? 'bg-amber-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                        <span className="font-bold">
                          {msg.isAdminReply ? 'You (Administrator)' : selectedTicket.customer?.fullName}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Reply Box */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-b-2xl">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type official administrative reply to customer..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
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
                    className="self-end bg-amber-600 hover:bg-amber-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[600px] flex items-center justify-center text-slate-400 text-xs">
              Select a ticket on the left to review and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
