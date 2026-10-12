export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NEXBANK API — Online Banking System',
    version: '1.0.0',
    description:
      'Enterprise RESTful API for NEXBANK Educational Online Banking Simulation. Includes Customer & Admin operations, atomic transfers, double-entry ledger entries, and audit logs.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new customer account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane.doe@example.com' },
                  mobileNumber: { type: 'string', example: '+1 555-0199' },
                  dateOfBirth: { type: 'string', example: '1990-05-15' },
                  address: { type: 'string', example: '100 Market St, SF, CA' },
                  password: { type: 'string', example: 'Demo@123456' },
                  confirmPassword: { type: 'string', example: 'Demo@123456' },
                  acceptTerms: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account registered successfully' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'alex.morgan@nexbank.demo' },
                  password: { type: 'string', example: 'Customer@123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
        },
      },
    },
    '/transfers': {
      post: {
        summary: 'Execute atomic fund transfer',
        tags: ['Transfers'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sourceAccountId: { type: 'string' },
                  destinationAccountNumber: { type: 'string', example: 'NEX-10074912' },
                  amount: { type: 'number', example: 150.00 },
                  description: { type: 'string', example: 'Project Collaboration' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Transfer completed' },
        },
      },
    },
  },
};
