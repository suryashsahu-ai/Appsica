import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let supportsTransactions = false;

export async function connectDB(uri = env.MONGODB_URI) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!uri) {
    throw new Error('Database connection failed: MONGODB_URI is not defined.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    console.log(`[Database] Connected to MongoDB host: ${conn.connection.host}, database: ${conn.connection.name}`);

    // Check if the current deployment supports transactions (Replica Set)
    try {
      const adminDb = conn.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      supportsTransactions = Boolean(serverStatus?.repl?.setName);
      console.log(`[Database] Deployment replica set: ${serverStatus?.repl?.setName || 'None (Standalone)'}. Multi-document transactions supported: ${supportsTransactions}`);
    } catch {
      supportsTransactions = false;
    }

    return conn.connection;
  } catch (error) {
    console.error(`[Database Error] Connection attempt failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Disconnected from MongoDB.');
  }
}

export function getTransactionSupport() {
  return supportsTransactions;
}
