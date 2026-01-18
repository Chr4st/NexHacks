import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Shield, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const settingsCategories = [
    {
      title: 'Profile',
      description: 'Manage your account information',
      icon: User,
      href: '/settings/profile',
    },
    {
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: Bell,
      href: '/settings/notifications',
    },
    {
      title: 'Security',
      description: 'Manage API keys and security settings',
      icon: Shield,
      href: '/settings/security',
    },
    {
      title: 'Billing',
      description: 'Manage subscription and payment',
      icon: CreditCard,
      href: '/settings/billing',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.href} href={category.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

