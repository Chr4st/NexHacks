import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Plus, Copy, Trash2 } from 'lucide-react';

async function getApiKeys() {
  // TODO: Replace with real API call
  return [
    {
      id: '1',
      name: 'Production API Key',
      key: 'fg_live_••••••••••••••••••••••••••••',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'fg_test_••••••••••••••••••••••••••••',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

export default async function ApiKeysPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const apiKeys = await getApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Keys
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your API keys for programmatic access
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate API requests. Keep them secret.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-2">
                    <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {key.key}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created {new Date(key.createdAt).toLocaleDateString()} • 
                      Last used {new Date(key.lastUsed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

