import { MongoClient, Db, ObjectId } from 'mongodb';
import type { Experiment } from '../tracing/types.js';

/**
 * Temporary MongoDB Repository for Agent A2 development
 * Uses MongoMemoryServer for in-memory testing
 * Will be replaced with Agent A1's implementation on integration
 */
export class FlowGuardRepository {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(private uri: string) {}

  async connect(): Promise<void> {
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db('flowguard');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  private getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // ============================================================================
  // Experiment Methods
  // ============================================================================

  async saveExperiment(experiment: Experiment): Promise<void> {
    await this.getDb().collection('experiments').insertOne(experiment);
  }

  async getRecentExperiments(limit: number): Promise<Experiment[]> {
    return this.getDb()
      .collection<Experiment>('experiments')
      .find()
      .sort({ runAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getExperimentsByPromptVersion(version: string): Promise<Experiment[]> {
    return this.getDb()
      .collection<Experiment>('experiments')
      .find({
        $or: [
          { 'promptVersions.control.version': version },
          { 'promptVersions.variant.version': version }
        ]
      })
      .sort({ runAt: -1 })
      .toArray();
  }

  async getExperimentById(experimentId: string): Promise<Experiment | null> {
    return this.getDb()
      .collection<Experiment>('experiments')
      .findOne({ experimentId });
  }

  async getAllExperiments(): Promise<Experiment[]> {
    return this.getDb()
      .collection<Experiment>('experiments')
      .find()
      .sort({ runAt: -1 })
      .toArray();
  }

  async deleteAllExperiments(): Promise<number> {
    const result = await this.getDb().collection('experiments').deleteMany({});
    return result.deletedCount;
  }
}
