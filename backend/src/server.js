import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './config/logger.js';

let server;

const startServer = async () => {
  try {
    // Initialize database connection
    await connectDB();

    server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(`CRITICAL: Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

const handleGracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.info('Graceful shutdown complete.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Enforce termination if cleanup hangs
  setTimeout(() => {
    logger.error('Cleanup timed out. Forcefully terminating process.');
    process.exit(1);
  }, 10000);
};

// Process event listeners
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.stack || error.message}`);
  process.exit(1);
});

startServer();
