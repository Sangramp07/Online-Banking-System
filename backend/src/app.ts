import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { swaggerDocument } from './config/swagger.js';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for Swagger UI assets & local development
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration for cookies and auth headers
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        ENV.FRONTEND_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Allow all during deployment setup
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// HTTP Request Logger in development
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    name: 'NEXBANK Banking API',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

// Swagger Interactive API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Versioned API Routes
app.use('/api/v1', apiRouter);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
