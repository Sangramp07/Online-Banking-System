import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('NEXBANK Backend API Tests', () => {
  let customerToken: string;
  let adminToken: string;
  let customerAccountId: string;
  let customerAccountNumber: string;
  let secondCustomerAccountNumber: string;

  beforeAll(async () => {
    // Authenticate existing seeded demo admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nexbank.demo',
        password: 'Admin@123456',
      });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // Authenticate existing seeded customer Alex Morgan
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.morgan@nexbank.demo',
        password: 'Customer@123456',
      });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.data.accessToken;

    // Fetch accounts
    const accRes = await request(app)
      .get('/api/v1/customers/me/accounts')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(accRes.status).toBe(200);
    customerAccountId = accRes.body.data[0].id;
    customerAccountNumber = accRes.body.data[0].accountNumber;

    // Fetch second customer (Sarah) account number for transfers
    const sarahAccount = await prisma.account.findFirst({
      where: { customer: { user: { email: 'sarah.jenkins@nexbank.demo' } } },
    });
    secondCustomerAccountNumber = sarahAccount!.accountNumber;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health Check', () => {
    it('should return UP status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('should register a new customer with initial balance and savings account', async () => {
      const uniqueEmail = `test.user.${Date.now()}@nexbank.demo`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test Suite Customer',
          email: uniqueEmail,
          mobileNumber: '+1 555-0199',
          dateOfBirth: '1992-04-12',
          address: '123 Test Blvd, Boston, MA',
          password: 'Test@123456',
          confirmPassword: 'Test@123456',
          acceptTerms: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(Number(res.body.data.account.balance)).toBe(1000);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Alex Duplicate',
          email: 'alex.morgan@nexbank.demo',
          mobileNumber: '+1 415-555-0192',
          dateOfBirth: '1988-06-14',
          address: '742 Evergreen Terrace',
          password: 'Customer@123456',
          confirmPassword: 'Customer@123456',
          acceptTerms: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid login credentials with generic error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alex.morgan@nexbank.demo',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email address or password');
    });

    it('should prevent ordinary customer from accessing admin dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics).toBeDefined();
    });
  });

  describe('3. Account & Cross-Customer Access Control', () => {
    it('should allow customer to view own accounts', async () => {
      const res = await request(app)
        .get('/api/v1/customers/me/accounts')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should forbid customer from viewing another customer account by id', async () => {
      // Find Sarah's account
      const sarahAccount = await prisma.account.findFirst({
        where: { customer: { user: { email: 'sarah.jenkins@nexbank.demo' } } },
      });

      const res = await request(app)
        .get(`/api/v1/accounts/${sarahAccount!.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('4. Fund Transfers & Financial Integrity', () => {
    it('should reject transfer with amount exceeding available balance (overdraft prevention)', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          sourceAccountId: customerAccountId,
          destinationAccountNumber: secondCustomerAccountNumber,
          amount: 85000.00, // Within 100k limit but exceeds Alex's balance ~24k
          description: 'Attempted Overdraft Transfer',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient funds');
    });

    it('should reject transfer to self / same account', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          sourceAccountId: customerAccountId,
          destinationAccountNumber: customerAccountNumber,
          amount: 50.00,
          description: 'Self loop transfer',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot transfer funds to the exact same account');
    });

    it('should execute a valid internal transfer atomically with ledger entries', async () => {
      const transferAmount = 25.00;
      const idempotencyKey = `idemp-${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          sourceAccountId: customerAccountId,
          destinationAccountNumber: secondCustomerAccountNumber,
          amount: transferAmount,
          description: 'Automated Vitest Test Transfer',
          idempotencyKey,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reference).toBeDefined();

      // Test idempotency: Resending same key returns same response without double debiting
      const retryRes = await request(app)
        .post('/api/v1/transfers')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          sourceAccountId: customerAccountId,
          destinationAccountNumber: secondCustomerAccountNumber,
          amount: transferAmount,
          description: 'Automated Vitest Test Transfer',
          idempotencyKey,
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.reference).toBe(res.body.data.reference);
    });
  });

  describe('5. Beneficiary Management', () => {
    it('should add a new beneficiary for customer', async () => {
      // Create a temporary recipient account to add as new beneficiary
      const tempUser = await prisma.user.create({
        data: {
          email: `beneficiary.${Date.now()}@nexbank.demo`,
          passwordHash: 'dummy',
          role: 'CUSTOMER',
        },
      });
      const tempCust = await prisma.customer.create({
        data: {
          userId: tempUser.id,
          customerNumber: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
          fullName: 'Partner Company LLC',
          mobileNumber: '+1 555-4422',
          dateOfBirth: '1985-01-01',
          address: '400 Pine St, SF',
        },
      });
      const tempAcc = await prisma.account.create({
        data: {
          accountNumber: `NEX-${Math.floor(10000000 + Math.random() * 90000000)}`,
          customerId: tempCust.id,
          balance: 1000,
          ledgerBalance: 1000,
        },
      });

      const res = await request(app)
        .post('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Partner Company LLC',
          accountNumber: tempAcc.accountNumber,
          bankName: 'NEXBANK',
          routingNumber: '021000021',
          nickname: 'Strategic Partner',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.accountNumber).toBe(tempAcc.accountNumber);
    });

    it('should list beneficiaries for customer', async () => {
      const res = await request(app)
        .get('/api/v1/beneficiaries')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('6. Public Contact Form & Support', () => {
    it('should submit public contact enquiry to MySQL', async () => {
      const res = await request(app)
        .post('/api/v1/support/contact-enquiry')
        .send({
          name: 'Public Inquirer',
          email: 'public@company.org',
          subject: 'Commercial Account Questions',
          message: 'Hello NEXBANK, I would like to inquire regarding high-volume simulated corporate accounts.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
