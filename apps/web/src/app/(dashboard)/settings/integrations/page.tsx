'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Check, ExternalLink, RefreshCw, Trash2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  email: string;
}

interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  description?: string;
  language?: string;
  stars: number;
  updatedAt: string;
  htmlUrl: string;
  flowsEnabled?: boolean;
}

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto-connect on mount
  useEffect(() => {
    fetchGitHubData();
  }, []);

  const fetchGitHubData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub data');
      }

      setUser(data.user);

      // Load enabled repos from localStorage
      const enabledRepos = JSON.parse(localStorage.getItem('enabled_github_repos') || '{}');
      const reposWithState = data.repos.map((repo: GitHubRepo) => ({
        ...repo,
        flowsEnabled: enabledRepos[repo.id] || false,
      }));

      setRepos(reposWithState);
      setIsConnected(true);
    } catch (err) {
      console.error('GitHub connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to GitHub');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGitHubData();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setUser(null);
    setRepos([]);
    localStorage.removeItem('enabled_github_repos');
  };

  const toggleRepoFlows = (repoId: string) => {
    const updatedRepos = repos.map(repo =>
      repo.id === repoId
        ? { ...repo, flowsEnabled: !repo.flowsEnabled }
        : repo
    );
    setRepos(updatedRepos);

    // Save to localStorage
    const enabledRepos: Record<string, boolean> = {};
    updatedRepos.forEach(repo => {
      if (repo.flowsEnabled) {
        enabledRepos[repo.id] = true;
      }
    });
    localStorage.setItem('enabled_github_repos', JSON.stringify(enabledRepos));
  };

  const enabledCount = repos.filter(r => r.flowsEnabled).length;

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
                  Connect your GitHub account to generate flows from your repositories
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                  Make sure GITHUB_TOKEN is set in your .env.local file
                </p>
              </div>
            </div>
          ) : isConnected && user ? (
            <>
              {/* Connected Account Info */}
              <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.login}
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
                    {enabledCount > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        {enabledCount} enabled
                      </span>
                    )}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {repos.map(repo => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Github className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate"
                            >
                              {repo.fullName}
                            </a>
                            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            {repo.private && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                Private
                              </span>
                            )}
                            {repo.language && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                {repo.language}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {repo.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={repo.flowsEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleRepoFlows(repo.id)}
                        className="flex-shrink-0 ml-2"
                      >
                        {repo.flowsEnabled ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Enabled
                          </>
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              {enabledCount > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {enabledCount} {enabledCount === 1 ? 'Repository' : 'Repositories'} Enabled
                      </h4>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Generate test flows from your enabled repositories.
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/github/generate">
                        Generate Flows
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
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
