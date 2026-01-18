import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FlowGuardRepository } from '../../../../src/db/repository.js';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let memoryServer: MongoMemoryServer | null = null;

// Use in-memory MongoDB for local testing if no URI provided
async function getMongoUri(): Promise<string> {
  if (uri) {
    return uri;
  }
  
  // Local testing mode - use in-memory MongoDB
  if (process.env.LOCAL_TESTING === 'true' || process.env.NODE_ENV === 'development') {
    console.log('⚠️  No MONGODB_URI found, using in-memory MongoDB for local testing');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    return memoryServer.getUri();
  }
  
  throw new Error('MONGODB_URI is required. Set LOCAL_TESTING=true to use in-memory database.');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoUriPromise?: Promise<string>;
  };

  if (!globalWithMongo._mongoUriPromise) {
    globalWithMongo._mongoUriPromise = getMongoUri();
  }

  if (!globalWithMongo._mongoClientPromise) {
    const mongoUri = await globalWithMongo._mongoUriPromise;
    client = new MongoClient(mongoUri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  const mongoUri = await getMongoUri();
  client = new MongoClient(mongoUri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function getRepository(): Promise<FlowGuardRepository> {
  const db = await getDatabase();
  return new FlowGuardRepository(db);
}

