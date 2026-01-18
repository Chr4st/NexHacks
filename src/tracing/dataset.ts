import fs from 'fs/promises';
import { BenchmarkDatasetSchema, type BenchmarkExample, type BenchmarkDataset } from './types.js';

/**
 * Dataset Manager for loading and managing benchmark datasets
 */
export class DatasetManager {
  constructor(private datasetPath: string) {}

  /**
   * Load the complete dataset from JSON file
   */
  async load(): Promise<BenchmarkDataset> {
    const content = await fs.readFile(this.datasetPath, 'utf-8');
    const data = JSON.parse(content);
    return BenchmarkDatasetSchema.parse(data);
  }

  /**
   * Get examples by category
   */
  async getExamplesByCategory(category: string): Promise<BenchmarkExample[]> {
    const dataset = await this.load();
    return dataset.examples.filter(ex => ex.metadata.category === category);
  }

  /**
   * Get examples by difficulty level
   */
  async getExamplesByDifficulty(difficulty: string): Promise<BenchmarkExample[]> {
    const dataset = await this.load();
    return dataset.examples.filter(ex => ex.metadata.difficulty === difficulty);
  }

  /**
   * Get a random sample of examples
   */
  async getRandomSample(count: number): Promise<BenchmarkExample[]> {
    const dataset = await this.load();
    const shuffled = [...dataset.examples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get total number of examples in dataset
   */
  async getCount(): Promise<number> {
    const dataset = await this.load();
    return dataset.total_examples;
  }

  /**
   * Get examples by ID
   */
  async getExampleById(id: string): Promise<BenchmarkExample | null> {
    const dataset = await this.load();
    return dataset.examples.find(ex => ex.id === id) || null;
  }

  /**
   * Save dataset to file
   */
  async save(dataset: BenchmarkDataset): Promise<void> {
    const content = JSON.stringify(dataset, null, 2);
    await fs.writeFile(this.datasetPath, content, 'utf-8');
  }
}
