import { app } from './app.js';
import { ENV } from './config/env.js';
import { prisma } from './config/database.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`🚀 NEXBANK Backend running on http://localhost:${PORT}`);
    console.log(`📖 API Documentation available at http://localhost:${PORT}/api/docs`);
    console.log(`🩺 Health check available at http://localhost:${PORT}/api/health`);
  } catch (error) {
    console.error('❌ Database connection failure during startup:', error);
    process.exit(1);
  }
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ MySQL Prisma connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
