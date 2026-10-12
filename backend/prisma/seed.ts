import { PrismaClient, Role, KycStatus, CustomerStatus, AccountType, AccountStatus, TransferStatus, EntryType, TicketPriority, TicketStatus, NotificationType, AuditOutcome } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('--- Clearing existing demo data ---');
  await prisma.transactionEntry.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.contactEnquiry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Creating Admin User ---');
  const adminPasswordHash = await bcrypt.hash('Admin@123456', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexbank.demo',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  console.log('--- Creating Customer Users ---');
  const customerPasswordHash = await bcrypt.hash('Customer@123456', SALT_ROUNDS);

  // Customer 1: Arjun Sharma
  const user1 = await prisma.user.create({
    data: {
      email: 'arjun.sharma@nexbank.demo',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000 * 2),
    },
  });

  const customer1 = await prisma.customer.create({
    data: {
      userId: user1.id,
      customerNumber: 'CUST-80214',
      fullName: 'Arjun Sharma',
      mobileNumber: '+91 98765 43210',
      dateOfBirth: '1990-03-15',
      address: '42, Rajpath Colony, Sector 18, Noida, Uttar Pradesh 201301',
      kycStatus: KycStatus.VERIFIED,
      status: CustomerStatus.ACTIVE,
    },
  });

  const account1Savings = await prisma.account.create({
    data: {
      accountNumber: 'NEX-10080214',
      customerId: customer1.id,
      accountType: AccountType.SAVINGS,
      balance: new Decimal(185500.00),
      ledgerBalance: new Decimal(185500.00),
      currency: 'INR',
      status: AccountStatus.ACTIVE,
    },
  });

  const account1Current = await prisma.account.create({
    data: {
      accountNumber: 'NEX-20080214',
      customerId: customer1.id,
      accountType: AccountType.CURRENT,
      balance: new Decimal(62000.00),
      ledgerBalance: new Decimal(62000.00),
      currency: 'INR',
      status: AccountStatus.ACTIVE,
    },
  });

  // Customer 2: Priya Patel
  const user2 = await prisma.user.create({
    data: {
      email: 'priya.patel@nexbank.demo',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000 * 5),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: user2.id,
      customerNumber: 'CUST-74912',
      fullName: 'Priya Patel',
      mobileNumber: '+91 91234 56789',
      dateOfBirth: '1993-07-22',
      address: '15, Patel Nagar, Vastrapur, Ahmedabad, Gujarat 380015',
      kycStatus: KycStatus.VERIFIED,
      status: CustomerStatus.ACTIVE,
    },
  });

  const account2Savings = await prisma.account.create({
    data: {
      accountNumber: 'NEX-10074912',
      customerId: customer2.id,
      accountType: AccountType.SAVINGS,
      balance: new Decimal(254000.50),
      ledgerBalance: new Decimal(254000.50),
      currency: 'INR',
      status: AccountStatus.ACTIVE,
    },
  });

  // Customer 3: Ravi Kumar
  const user3 = await prisma.user.create({
    data: {
      email: 'ravi.kumar@nexbank.demo',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000 * 24),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: user3.id,
      customerNumber: 'CUST-63189',
      fullName: 'Ravi Kumar',
      mobileNumber: '+91 87654 32109',
      dateOfBirth: '1996-11-08',
      address: '78, Anna Nagar West, Chennai, Tamil Nadu 600040',
      kycStatus: KycStatus.VERIFIED,
      status: CustomerStatus.ACTIVE,
    },
  });

  const account3Savings = await prisma.account.create({
    data: {
      accountNumber: 'NEX-10063189',
      customerId: customer3.id,
      accountType: AccountType.SAVINGS,
      balance: new Decimal(98500.00),
      ledgerBalance: new Decimal(98500.00),
      currency: 'INR',
      status: AccountStatus.ACTIVE,
    },
  });

  console.log('--- Creating Beneficiaries ---');
  await prisma.beneficiary.createMany({
    data: [
      {
        customerId: customer1.id,
        name: 'Priya Patel',
        accountNumber: account2Savings.accountNumber,
        bankName: 'NEXBANK',
        routingNumber: '021000021',
        nickname: 'Priya (Business Partner)',
        isVerified: true,
        isActive: true,
      },
      {
        customerId: customer1.id,
        name: 'Ravi Kumar',
        accountNumber: account3Savings.accountNumber,
        bankName: 'NEXBANK',
        routingNumber: '021000021',
        nickname: 'Ravi (Friend)',
        isVerified: true,
        isActive: true,
      },
      {
        customerId: customer2.id,
        name: 'Arjun Sharma',
        accountNumber: account1Savings.accountNumber,
        bankName: 'NEXBANK',
        routingNumber: '021000021',
        nickname: 'Arjun (Colleague)',
        isVerified: true,
        isActive: true,
      },
    ],
  });

  console.log('--- Creating Historical Simulated Transfers & Ledger Entries ---');
  async function recordDemoTransfer(opts: {
    reference: string;
    sourceAccount: any;
    destAccount: any;
    amount: number;
    description: string;
    initiatedUserId: string;
    hoursAgo: number;
    sourcePostBalance: number;
    destPostBalance: number;
  }) {
    const timestamp = new Date(Date.now() - 3600000 * opts.hoursAgo);
    const transfer = await prisma.transfer.create({
      data: {
        reference: opts.reference,
        sourceAccountId: opts.sourceAccount.id,
        destinationAccountId: opts.destAccount.id,
        amount: new Decimal(opts.amount),
        currency: 'INR',
        description: opts.description,
        status: TransferStatus.COMPLETED,
        initiatedByUserId: opts.initiatedUserId,
        createdAt: timestamp,
        completedAt: timestamp,
      },
    });

    await prisma.transactionEntry.create({
      data: {
        transferId: transfer.id,
        accountId: opts.sourceAccount.id,
        type: EntryType.DEBIT,
        amount: new Decimal(opts.amount),
        balanceAfter: new Decimal(opts.sourcePostBalance),
        description: `Transfer to ${opts.destAccount.accountNumber} - ${opts.description}`,
        createdAt: timestamp,
      },
    });

    await prisma.transactionEntry.create({
      data: {
        transferId: transfer.id,
        accountId: opts.destAccount.id,
        type: EntryType.CREDIT,
        amount: new Decimal(opts.amount),
        balanceAfter: new Decimal(opts.destPostBalance),
        description: `Transfer from ${opts.sourceAccount.accountNumber} - ${opts.description}`,
        createdAt: timestamp,
      },
    });

    return transfer;
  }

  // 1. Initial Salary Credit for Arjun
  const tOpening1 = await prisma.transfer.create({
    data: {
      reference: 'TRX-INIT-ARJUN-01',
      sourceAccountId: account1Savings.id,
      destinationAccountId: account1Savings.id,
      amount: new Decimal(150000.00),
      currency: 'INR',
      description: 'Monthly Salary Credit - Tech Mahindra',
      status: TransferStatus.COMPLETED,
      initiatedByUserId: user1.id,
      createdAt: new Date(Date.now() - 3600000 * 24 * 14),
      completedAt: new Date(Date.now() - 3600000 * 24 * 14),
    },
  });
  await prisma.transactionEntry.create({
    data: {
      transferId: tOpening1.id,
      accountId: account1Savings.id,
      type: EntryType.CREDIT,
      amount: new Decimal(150000.00),
      balanceAfter: new Decimal(150000.00),
      description: 'Monthly Salary Credit - Tech Mahindra',
      createdAt: new Date(Date.now() - 3600000 * 24 * 14),
    },
  });

  // 2. FD Maturity Credit
  const tOpening2 = await prisma.transfer.create({
    data: {
      reference: 'TRX-INIT-ARJUN-02',
      sourceAccountId: account1Savings.id,
      destinationAccountId: account1Savings.id,
      amount: new Decimal(45000.00),
      currency: 'INR',
      description: 'Fixed Deposit Maturity - Q3 Interest Payout',
      status: TransferStatus.COMPLETED,
      initiatedByUserId: user1.id,
      createdAt: new Date(Date.now() - 3600000 * 24 * 7),
      completedAt: new Date(Date.now() - 3600000 * 24 * 7),
    },
  });
  await prisma.transactionEntry.create({
    data: {
      transferId: tOpening2.id,
      accountId: account1Savings.id,
      type: EntryType.CREDIT,
      amount: new Decimal(45000.00),
      balanceAfter: new Decimal(195000.00),
      description: 'Fixed Deposit Maturity - Q3 Interest Payout',
      createdAt: new Date(Date.now() - 3600000 * 24 * 7),
    },
  });

  // 3. Arjun transfers ₹9,500 to Priya for project work
  await recordDemoTransfer({
    reference: 'TRX-DEMO-0012',
    sourceAccount: account1Savings,
    destAccount: account2Savings,
    amount: 9500.00,
    description: 'Website Design Project Milestone Payment',
    initiatedUserId: user1.id,
    hoursAgo: 48,
    sourcePostBalance: 185500.00,
    destPostBalance: 263500.50,
  });

  // 4. Arjun transfers ₹5,000 to Ravi for EMI split
  await recordDemoTransfer({
    reference: 'TRX-DEMO-0015',
    sourceAccount: account1Savings,
    destAccount: account3Savings,
    amount: 5000.00,
    description: 'Shared Flat EMI - October',
    initiatedUserId: user1.id,
    hoursAgo: 18,
    sourcePostBalance: 185500.00,
    destPostBalance: 98500.00,
  });

  // 5. Transfer between Arjun Savings and Current
  await recordDemoTransfer({
    reference: 'TRX-DEMO-0019',
    sourceAccount: account1Current,
    destAccount: account1Savings,
    amount: 10000.00,
    description: 'Self Transfer - Monthly SIP Allocation',
    initiatedUserId: user1.id,
    hoursAgo: 6,
    sourcePostBalance: 62000.00,
    destPostBalance: 185500.00,
  });

  console.log('--- Creating Notifications ---');
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        title: 'Salary Credited Successfully',
        message: 'Your monthly salary of ₹1,50,000.00 from Tech Mahindra has been credited to NEX-10080214.',
        type: NotificationType.SUCCESS,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 14),
      },
      {
        userId: user1.id,
        title: 'Transfer Sent Successfully',
        message: 'Transfer of ₹9,500.00 to Priya Patel (NEX-10074912) completed successfully.',
        type: NotificationType.INFO,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        userId: user1.id,
        title: 'Security Alert: New Sign-In Detected',
        message: 'A successful login was recorded from Noida, UP (Chrome on Windows). If this was not you, contact support.',
        type: NotificationType.WARNING,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  console.log('--- Creating Support Tickets & Messages ---');
  const ticket1 = await prisma.supportTicket.create({
    data: {
      ticketNumber: 'TICK-1082',
      customerId: customer1.id,
      subject: 'Query about UPI and IMPS Transfer Limits',
      category: 'Transfers & Payments',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      createdAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  await prisma.supportMessage.createMany({
    data: [
      {
        ticketId: ticket1.id,
        senderUserId: user1.id,
        message: 'Namaste! Mujhe pata karna tha ki meri savings account se ek baar mein maximum kitna transfer ho sakta hai?',
        isAdminReply: false,
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        ticketId: ticket1.id,
        senderUserId: admin.id,
        message: 'Namaste Arjun ji, aapki savings account ke liye per-transaction limit ₹10,00,000 hai. Agar aapko higher limit chahiye to branch se request kar sakte hain. Koi aur sawaal ho to batayein.',
        isAdminReply: true,
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
    ],
  });

  console.log('--- Creating Contact Enquiries ---');
  await prisma.contactEnquiry.createMany({
    data: [
      {
        name: 'Suresh Mehta',
        email: 'suresh.mehta@bizindia.com',
        subject: 'Business Account Opening Inquiry',
        message: 'Hum ek startup hain aur business current account kholna chahte hain. Please GST registration ke saath kya documents chahiye batayein.',
        status: 'NEW',
        createdAt: new Date(Date.now() - 3600000 * 8),
      },
    ],
  });

  console.log('--- Creating Initial Audit Logs ---');
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        action: 'SYSTEM_BOOTSTRAP_SEED',
        targetType: 'System',
        targetId: 'ALL',
        details: JSON.stringify({ environment: 'development', accountsSeeded: 4, currency: 'INR' }),
        outcome: AuditOutcome.SUCCESS,
        reason: 'Initial system seeding with Indian demo data',
      },
      {
        actorUserId: user1.id,
        action: 'USER_LOGIN',
        targetType: 'User',
        targetId: user1.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        outcome: AuditOutcome.SUCCESS,
      },
    ],
  });

  console.log('✅ Demo database seeded successfully with Indian data!');
  console.log('Admin:    admin@nexbank.demo / Admin@123456');
  console.log('Customer: arjun.sharma@nexbank.demo / Customer@123456');
  console.log('Customer: priya.patel@nexbank.demo / Customer@123456');
  console.log('Customer: ravi.kumar@nexbank.demo / Customer@123456');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
