import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FlowForm } from '@/components/flows/flow-form';

export default async function NewFlowPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/flows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Create New Flow</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flow Configuration</CardTitle>
          <CardDescription>
            Define the steps and assertions for your user flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlowForm />
        </CardContent>
      </Card>
    </div>
  );
}

