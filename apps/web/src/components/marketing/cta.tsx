'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to improve your UX?
          </h2>
          <p className="mt-6 text-lg leading-8 text-indigo-100">
            Start testing your user flows with AI-powered validation today.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/dashboard">View Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

