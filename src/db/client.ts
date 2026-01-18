import { MongoClient, Db } from 'mongodb';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private client: MongoClient | null = null;
  private db: Db | null = null;

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
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required');
      }
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db('flowguard');
      console.log('✅ MongoDB connected successfully');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
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
