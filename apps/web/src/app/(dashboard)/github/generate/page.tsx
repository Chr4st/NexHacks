'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface GeneratedFlow {
  _id: string;
  name: string;
  intent: string;
  url?: string;
  steps: any[];
  tags: string[];
}

interface AnalysisStats {
  routes: number;
  components: number;
  apiEndpoints: number;
  cached: boolean;
}

export default function GitHubGeneratePage() {
  const [repoUrl, setRepoUrl] = useState('nodeDevcoder/blogspot');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flows, setFlows] = useState<GeneratedFlow[]>([]);
  const [savedFlows, setSavedFlows] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [analysisStats, setAnalysisStats] = useState<AnalysisStats | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setFlows([]);
    setSavedFlows([]);
    setRepoInfo(null);
    setAnalysisStats(null);
    setProgressMessage('Analyzing repository...');

    try {
      const res = await fetch('/api/github/generate-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, forceRefresh: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flows');
      }

      setProgressMessage('Saving flows to database...');
      setFlows(data.flows);
      setRepoInfo(data.repository);
      setAnalysisStats(data.analysis);

      // Save each flow to MongoDB via the API
      setSaving(true);
      const savedIds: string[] = [];

      for (const flow of data.flows) {
        try {
          const saveRes = await fetch('/api/flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: flow.name,
              intent: flow.intent,
              url: flow.url || repoInfo?.homepage || '',
              steps: flow.steps,
              tags: flow.tags || [],
            }),
          });

          if (saveRes.ok) {
            const saveData = await saveRes.json();
            savedIds.push(saveData.id);
          }
        } catch (saveErr) {
          console.error('Failed to save flow:', flow.name, saveErr);
        }
      }

      setSavedFlows(savedIds);
      setProgressMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgressMessage('');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Generate Flows from GitHub
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Automatically generate test flows by analyzing a GitHub repository
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repository URL</CardTitle>
          <CardDescription>
            Enter a GitHub repository (e.g., owner/repo or full URL)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="owner/repo or https://github.com/owner/repo"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !repoUrl}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Generate Flows
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {progressMessage && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">{progressMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {repoInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Repository Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {repoInfo.fullName}
                </div>
                <div>
                  <span className="font-medium">Language:</span> {repoInfo.language}
                </div>
                {repoInfo.description && (
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {repoInfo.description}
                  </div>
                )}
                {repoInfo.homepage && (
                  <div className="col-span-2">
                    <span className="font-medium">Homepage:</span>{' '}
                    <a
                      href={repoInfo.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {repoInfo.homepage}
                    </a>
                  </div>
                )}
              </div>

              {analysisStats && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Discovered</h4>
                    {analysisStats.cached && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (Loaded from cache)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analysisStats.routes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Routes</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {analysisStats.components}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Components</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {analysisStats.apiEndpoints}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">API Endpoints</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {flows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Flows</CardTitle>
                <CardDescription>
                  {savedFlows.length > 0
                    ? `${savedFlows.length} of ${flows.length} flows saved to database`
                    : saving
                    ? 'Saving flows...'
                    : `${flows.length} flow${flows.length > 1 ? 's' : ''} generated`}
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/flows">View All Flows</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flows.map((flow, index) => (
                <div
                  key={flow._id || index}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {flow.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {flow.intent}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {flow.steps.length} steps
                        </span>
                        {flow.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
