import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2 } from 'lucide-react';

async function getBillingInfo() {
  // TODO: Replace with real API call
  return {
    plan: 'Professional',
    price: 99,
    billingCycle: 'monthly',
    nextBillingDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
  };
}

export default async function BillingPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const billing = await getBillingInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{billing.plan}</div>
                <div className="text-sm text-muted-foreground">
                  ${billing.price}/{billing.billingCycle}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Active</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Next billing date: {new Date(billing.nextBillingDate).toLocaleDateString()}
              </div>
              <Button variant="outline" className="w-full">
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your default payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3">
                  <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium">
                    {billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires 12/25
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

