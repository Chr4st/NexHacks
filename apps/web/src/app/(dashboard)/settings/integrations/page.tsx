'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Check, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

interface ConnectedRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  flowsEnabled: boolean;
}

// Mock data for connected GitHub account
const mockGitHubUser = {
  login: 'johndoe',
  name: 'John Doe',
  avatarUrl: 'https://avatars.githubusercontent.com/u/12345678',
  email: 'john@example.com',
};

const mockConnectedRepos: ConnectedRepo[] = [
  {
    id: '1',
    name: 'my-ecommerce-app',
    fullName: 'johndoe/my-ecommerce-app',
    private: false,
    defaultBranch: 'main',
    flowsEnabled: true,
  },
  {
    id: '2',
    name: 'saas-dashboard',
    fullName: 'johndoe/saas-dashboard',
    private: true,
    defaultBranch: 'main',
    flowsEnabled: true,
  },
  {
    id: '3',
    name: 'marketing-site',
    fullName: 'johndoe/marketing-site',
    private: false,
    defaultBranch: 'master',
    flowsEnabled: false,
  },
];

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [repos, setRepos] = useState<ConnectedRepo[]>(mockConnectedRepos);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate OAuth flow delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConnected(true);
    setRepos(mockConnectedRepos);
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    setRepos([]);
  };

  const toggleRepoFlows = (repoId: string) => {
    setRepos(repos.map(repo =>
      repo.id === repoId
        ? { ...repo, flowsEnabled: !repo.flowsEnabled }
        : repo
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Integrations
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Connect external services to automate your testing workflows
        </p>
      </div>

      {/* GitHub Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100">
                <Github className="h-6 w-6 text-white dark:text-gray-900" />
              </div>
              <div>
                <CardTitle>GitHub</CardTitle>
                <CardDescription>
                  Connect your GitHub account to run flows on pull requests
                </CardDescription>
              </div>
            </div>
            {isConnected && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3" />
                Connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              {/* Connected Account Info */}
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <img
                    src={mockGitHubUser.avatarUrl}
                    alt={mockGitHubUser.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {mockGitHubUser.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{mockGitHubUser.login}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>

              {/* Connected Repositories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Repositories ({repos.length})
                  </h3>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {repos.map(repo => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Github className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://github.com/${repo.fullName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                            >
                              {repo.fullName}
                            </a>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                            {repo.private && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                Private
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Default branch: {repo.defaultBranch}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={repo.flowsEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleRepoFlows(repo.id)}
                      >
                        {repo.flowsEnabled ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Flows Enabled
                          </>
                        ) : (
                          'Enable Flows'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Status */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Webhook Active
                </h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  FlowGuard will automatically run UX tests when pull requests are opened or updated on enabled repositories.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Github className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Connect your GitHub account
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Link your GitHub account to automatically run FlowGuard tests on pull requests and get UX risk reports as PR comments.
              </p>
              <Button
                className="mt-6"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Connect GitHub
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-gray-500">More Integrations Coming Soon</CardTitle>
          <CardDescription>
            We&apos;re working on integrations with GitLab, Bitbucket, Slack, and more.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
