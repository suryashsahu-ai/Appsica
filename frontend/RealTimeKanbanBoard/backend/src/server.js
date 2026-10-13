import http from 'http';
import { createApp } from './app.js';
import { env, validateAndGetEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketHandler.js';

async function bootstrap() {
  try {
    // Validate environment at startup
    validateAndGetEnv();

    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.IO
    const { emitSocketEvent } = initSocketIO(server, env.CLIENT_URL);
    app.set('socketEmitter', emitSocketEvent);

    // Connect to database
    await connectDB();

    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`[Server] RealTimeKanbanBoard backend listening on port ${PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Allowed Client URL: ${env.CLIENT_URL}`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Graceful shutdown completed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err) {
    console.error(`[Server Fatal Error] ${err.message}`);
    process.exit(1);
  }
}

bootstrap();
