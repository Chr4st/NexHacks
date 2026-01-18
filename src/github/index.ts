export { GitHubAppClient } from './app.js';
export type { 
  PostCommentParams, 
  CreateCheckRunParams, 
  UpdateCheckRunParams, 
  GetPRFilesParams 
} from './app.js';

export { CommentGenerator } from './comment-generator.js';

export { verifyWebhookSignature, createSignature } from './signature.js';

export { createWebhookServer, startServer } from './server.js';
export type { WebhookServerConfig } from './server.js';

export { WebhookHandler } from './webhook-handler.js';
export type { WebhookHandlerConfig, TestRunner } from './webhook-handler.js';

export type {
  GitHubAppConfig,
  WebhookPayload,
  PullRequestPayload,
  PushPayload,
  FlowGuardResult,
  CheckRunStatus,
  PRCommentData
} from './types.js';

export { FLOWGUARD_COMMENT_MARKER } from './types.js';

// Database integration (requires A1 MongoDB module)
export {
  testResultToFlowGuardResult,
  flowGuardResultToTestResult,
  extractPRContext,
  createPersistentTestRunner,
  getFlowHistory,
  flowRunResultToFlowGuardResult,
  createFlowGuardTestRunner
} from './db-integration.js';
