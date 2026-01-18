'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small teams',
    features: [
      'Up to 10 flows',
      '100 test runs/month',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'For growing teams',
    features: [
      'Unlimited flows',
      '1,000 test runs/month',
      'Advanced analytics',
      'CrUX integration',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Unlimited test runs',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Choose the plan that fits your needs
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-gray-900/10 dark:ring-gray-700 ${
                plan.popular ? 'ring-2 ring-indigo-600 dark:ring-indigo-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={plan.popular ? 'default' : 'outline'}>
                <Link href="/sign-up">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

