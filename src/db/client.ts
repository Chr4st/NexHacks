import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private memoryServer: MongoMemoryServer | null = null;

  private constructor() {
    // Constructor is intentionally empty - URI is checked in connect()
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async connect(): Promise<Db> {
    if (!this.db) {
      const localTesting = process.env.LOCAL_TESTING === 'true' || !process.env.MONGODB_URI;
      let uri = process.env.MONGODB_URI;

      // Use in-memory MongoDB for local testing if no URI provided
      if (!uri && localTesting) {
        console.log('⚠️  No MONGODB_URI found, using in-memory MongoDB for local testing');
        this.memoryServer = await MongoMemoryServer.create();
        uri = this.memoryServer.getUri();
        console.log('✅ In-memory MongoDB started');
      }

      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required. Set LOCAL_TESTING=true to use in-memory database.');
      }

      // Validate URI format
      if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
        throw new Error('Invalid MongoDB URI format');
      }

      const dbName = process.env.MONGODB_DATABASE || 'flowguard';
      const useMockMongo = localTesting && !process.env.MONGODB_URI;

      this.client = new MongoClient(uri, {
        tls: process.env.NODE_ENV === 'production' && !useMockMongo,
        tlsAllowInvalidCertificates: false,
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log('✅ MongoDB connected successfully');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
    if (this.memoryServer) {
      await this.memoryServer.stop();
      this.memoryServer = null;
      console.log('✅ In-memory MongoDB stopped');
    } else {
      console.log('✅ MongoDB disconnected');
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

// Export singleton instance
export const db = DatabaseClient.getInstance();
