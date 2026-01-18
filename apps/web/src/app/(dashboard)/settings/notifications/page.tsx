import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function NotificationsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Configure notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what email notifications you receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Test Failures</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when a test flow fails
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Weekly Reports</div>
                <div className="text-sm text-muted-foreground">
                  Receive weekly summary reports
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Product Updates</div>
                <div className="text-sm text-muted-foreground">
                  News about new features and improvements
                </div>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
          <Button className="mt-6">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}

