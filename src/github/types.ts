export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
}

export interface WebhookPayload {
  action: string;
  installation: {
    id: number;
  };
  repository: {
    owner: {
      login: string;
    };
    name: string;
    full_name: string;
  };
  sender: {
    login: string;
  };
}

export interface PullRequestPayload extends WebhookPayload {
  action: 'opened' | 'synchronize' | 'reopened' | 'closed';
  number: number;
  pull_request: {
    number: number;
    title: string;
    head: {
      sha: string;
      ref: string;
    };
    base: {
      ref: string;
    };
    user: {
      login: string;
    };
  };
}

export interface PushPayload extends WebhookPayload {
  ref: string;
  before: string;
  after: string;
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

export interface FlowGuardResult {
  flowName: string;
  passed: boolean;
  duration: number;
  steps: Array<{
    name: string;
    passed: boolean;
    screenshot?: string;
    error?: string;
  }>;
  reportUrl?: string;
}

export interface CheckRunStatus {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
}

export interface PRCommentData {
  owner: string;
  repo: string;
  prNumber: number;
  results: FlowGuardResult[];
  reportUrl?: string;
}

export const FLOWGUARD_COMMENT_MARKER = '<!-- flowguard-report -->';
