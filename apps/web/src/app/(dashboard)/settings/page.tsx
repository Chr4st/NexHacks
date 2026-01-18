import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Bell, Shield, CreditCard, Users } from 'lucide-react';
import Link from 'next/link';

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
    title: 'Team',
    description: 'Manage team members and permissions',
    icon: Users,
    href: '/settings/team',
  },
  {
    title: 'Billing',
    description: 'Manage subscription and payment',
    icon: CreditCard,
    href: '/settings/billing',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
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

