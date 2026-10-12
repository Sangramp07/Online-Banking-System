export type Role = 'CUSTOMER' | 'ADMIN';
export type AccountType = 'SAVINGS' | 'CURRENT';
export type AccountStatus = 'ACTIVE' | 'RESTRICTED' | 'FROZEN' | 'CLOSED';
export type TransferStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export type EntryType = 'DEBIT' | 'CREDIT';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName?: string;
  customerNumber?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  customer?: Customer;
}

export interface Customer {
  id: string;
  customerNumber: string;
  userId: string;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  kycStatus: string;
  status: CustomerStatus;
  createdAt: string;
  accounts?: Account[];
  user?: {
    email: string;
    isActive: boolean;
    lastLoginAt?: string;
  };
}

export interface Account {
  id: string;
  accountNumber: string;
  customerId: string;
  accountType: AccountType;
  balance: number | string;
  ledgerBalance: number | string;
  currency: string;
  status: AccountStatus;
  createdAt: string;
  customer?: {
    fullName: string;
    customerNumber: string;
  };
}

export interface Beneficiary {
  id: string;
  customerId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  nickname?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Transfer {
  id: string;
  reference: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number | string;
  currency: string;
  description: string;
  status: TransferStatus;
  failureReason?: string;
  reversalReason?: string;
  reversedAt?: string;
  completedAt?: string;
  createdAt: string;
  sourceAccount?: {
    accountNumber: string;
    customer?: { fullName: string };
  };
  destinationAccount?: {
    accountNumber: string;
    customer?: { fullName: string };
  };
  entries?: TransactionEntry[];
}

export interface TransactionEntry {
  id: string;
  transferId: string;
  accountId: string;
  type: EntryType;
  amount: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
  transfer?: {
    reference: string;
    status: TransferStatus;
    completedAt?: string;
  };
  account?: {
    accountNumber: string;
    accountType: AccountType;
  };
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  customer?: {
    fullName: string;
    customerNumber: string;
  };
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderUserId: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  sender?: {
    id: string;
    role: Role;
    customer?: { fullName: string };
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: string;
  reason?: string;
  createdAt: string;
  actor?: {
    email: string;
    role: Role;
  };
}

export interface DashboardMetrics {
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    totalAccounts: number;
    activeAccounts: number;
    restrictedAccounts: number;
    completedTransfers: number;
    totalSimulatedVolume: number;
    failedTransfers: number;
    openTickets: number;
  };
  charts: {
    monthlyVolume: Array<{ month: string; volume: number; count: number }>;
  };
  recentRegistrations: any[];
  recentTransfers: any[];
}
