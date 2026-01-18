import type { FlowGuardRepository } from '../db/repository.js';
import type { FlowExecutionData } from './types.js';

/**
 * ExecutionDataStorage provides MongoDB storage layer for flow execution data
 */
export class ExecutionDataStorage {
  constructor(private repository: FlowGuardRepository) {}

  /**
   * Save complete flow execution data
   */
  async saveFlowExecution(data: FlowExecutionData): Promise<string> {
    return await this.repository.saveFlowExecutionData(data);
  }

  /**
   * Retrieve flow execution by ID
   */
  async getFlowExecution(flowId: string): Promise<FlowExecutionData | null> {
    return await this.repository.getFlowExecutionData(flowId);
  }

  /**
   * Query executions for analysis
   */
  async queryExecutions(filters: {
    flowName?: string;
    verdict?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FlowExecutionData[]> {
    return await this.repository.queryFlowExecutions(filters);
  }
}
