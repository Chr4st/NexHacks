# Agent B1: Next.js SaaS Frontend — Detailed Specification

**AI Tool:** Cursor Pro
**Branch:** `feat/nextjs-saas-frontend`
**Priority:** P0 (Customer-Facing Application)
**Developer:** Team B (Developer 2 / Partner)
**Dependencies:** MongoDB Core (Agent A1) for API integration
**Estimated Effort:** 3-4 days

---

## Mission

Build a **production-grade Next.js SaaS application** that serves as FlowGuard's customer-facing platform:

1. **Modern Next.js 15 App Router** with Server Components
2. **Beautiful, responsive UI** using TailwindCSS + shadcn/ui
3. **Complete user flows**: Dashboard, Flows, Reports, Settings, Billing
4. **Real-time updates** using Server Actions and optimistic UI
5. **Authentication** with Clerk or NextAuth
6. **API routes** connecting to MongoDB backend
7. **Production deployment** ready for Vercel/DO App Platform

This is the **main customer interface** - it must be stunning, fast, and production-ready for demo.

---

## Technology Stack

### Framework & Core
- **Next.js 15** (App Router, React Server Components)
- **TypeScript** (strict mode)
- **React 19** (latest features)

### Styling & UI
- **TailwindCSS** (utility-first styling)
- **shadcn/ui** (beautiful component library)
- **Framer Motion** (smooth animations)
- **Lucide Icons** (consistent icon set)

### State & Data
- **Server Actions** (form submissions, mutations)
- **React Query / SWR** (data fetching, caching)
- **Zustand** (client state if needed)

### Auth & Security
- **Clerk** (recommended) or **NextAuth** (user auth)
- **Middleware** (route protection)

### Database Integration
- **API Routes** (Next.js API → MongoDB)
- **tRPC** (optional - type-safe API)

---

## File Structure

```
apps/
└── web/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    │
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                   # Root layout
    │   │   ├── page.tsx                     # Landing page
    │   │   ├── (marketing)/
    │   │   │   ├── layout.tsx
    │   │   │   ├── pricing/page.tsx
    │   │   │   └── docs/page.tsx
    │   │   │
    │   │   ├── (dashboard)/
    │   │   │   ├── layout.tsx               # Dashboard shell
    │   │   │   ├── dashboard/page.tsx       # Main dashboard
    │   │   │   ├── flows/
    │   │   │   │   ├── page.tsx             # Flows list
    │   │   │   │   ├── [id]/page.tsx        # Flow detail
    │   │   │   │   └── new/page.tsx         # Create flow
    │   │   │   ├── reports/
    │   │   │   │   ├── page.tsx             # Reports list
    │   │   │   │   └── [id]/page.tsx        # Report detail
    │   │   │   ├── analytics/page.tsx       # Analytics dashboard
    │   │   │   ├── settings/
    │   │   │   │   ├── page.tsx             # General settings
    │   │   │   │   ├── team/page.tsx        # Team management
    │   │   │   │   └── billing/page.tsx     # Billing & subscription
    │   │   │   └── api-keys/page.tsx        # API key management
    │   │   │
    │   │   ├── api/
    │   │   │   ├── flows/
    │   │   │   │   ├── route.ts             # GET /api/flows
    │   │   │   │   └── [id]/route.ts        # GET/PUT/DELETE /api/flows/:id
    │   │   │   ├── reports/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/route.ts
    │   │   │   ├── analytics/route.ts
    │   │   │   └── webhooks/route.ts
    │   │   │
    │   │   └── sign-in/[[...sign-in]]/page.tsx    # Auth pages
    │   │
    │   ├── components/
    │   │   ├── ui/                          # shadcn components
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── table.tsx
    │   │   │   └── ...
    │   │   ├── dashboard/
    │   │   │   ├── navbar.tsx
    │   │   │   ├── sidebar.tsx
    │   │   │   ├── user-menu.tsx
    │   │   │   └── breadcrumbs.tsx
    │   │   ├── flows/
    │   │   │   ├── flow-card.tsx
    │   │   │   ├── flow-editor.tsx
    │   │   │   ├── step-list.tsx
    │   │   │   └── run-button.tsx
    │   │   ├── reports/
    │   │   │   ├── report-card.tsx
    │   │   │   ├── report-viewer.tsx
    │   │   │   ├── screenshot-gallery.tsx
    │   │   │   └── test-results-table.tsx
    │   │   ├── analytics/
    │   │   │   ├── success-rate-chart.tsx
    │   │   │   ├── cost-chart.tsx
    │   │   │   ├── crux-metrics-card.tsx
    │   │   │   └── trend-indicator.tsx
    │   │   └── marketing/
    │   │       ├── hero.tsx
    │   │       ├── features.tsx
    │   │       └── pricing-cards.tsx
    │   │
    │   ├── lib/
    │   │   ├── api.ts                       # API client
    │   │   ├── mongodb.ts                   # MongoDB connection
    │   │   ├── utils.ts                     # Utilities
    │   │   └── validations.ts               # Zod schemas
    │   │
    │   ├── hooks/
    │   │   ├── use-flows.ts
    │   │   ├── use-reports.ts
    │   │   └── use-analytics.ts
    │   │
    │   └── types/
    │       └── index.ts
    │
    ├── public/
    │   ├── logo.svg
    │   └── og-image.png
    │
    └── .env.example
```

---

## Core Deliverables

### 1. Landing Page (Public)

**File:** `src/app/page.tsx`

**Features:**
- Hero section with gradient background
- Feature showcase
- Pricing preview
- CTA buttons (Start Free Trial)
- Demo video/screenshot
- Social proof (logos, testimonials)

**Design:**
```tsx
import { HeroSection } from '@/components/marketing/hero'
import { FeaturesSection } from '@/components/marketing/features'
import { PricingSection } from '@/components/marketing/pricing'
import { CTASection } from '@/components/marketing/cta'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </div>
  )
}
```

**Hero Component:**
```tsx
'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered UX Testing
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
            Ship Perfect UX
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Every Single Time
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            FlowGuard uses AI vision models to catch UX issues before your users do.
            Automated testing that actually understands your interface.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>

          <div className="mt-12">
            <img
              src="/dashboard-screenshot.png"
              alt="FlowGuard Dashboard"
              className="rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
            />
          </div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30">
          <div className="h-96 w-96 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      </div>
    </section>
  )
}
```

---

### 2. Dashboard Layout

**File:** `src/app/(dashboard)/layout.tsx`

**Features:**
- Responsive sidebar navigation
- Top navbar with user menu
- Breadcrumbs
- Quick actions
- Notifications

```tsx
import { Sidebar } from '@/components/dashboard/sidebar'
import { Navbar } from '@/components/dashboard/navbar'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Sidebar Component:**
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  BarChart3,
  Settings,
  Key,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Flows', href: '/flows', icon: GitBranch },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden w-64 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:block">
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          FlowGuard
        </h1>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

---

### 3. Dashboard Page

**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Features:**
- Overview stats (total flows, success rate, recent runs)
- Recent test results
- Cost analytics chart
- Quick actions (Run Flow, View Reports)
- Activity feed

```tsx
import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentRuns } from '@/components/dashboard/recent-runs'
import { CostChart } from '@/components/analytics/cost-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your flows.
        </p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <CostChart />
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <RecentRuns />
      </Suspense>
    </div>
  )
}
```

**Stats Cards Component:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, CheckCircle2, DollarSign } from 'lucide-react'
import { getStats } from '@/lib/api'

export async function StatsCards() {
  const stats = await getStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFlows}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-green-600" />
            +3 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-green-600" />
            +2.5% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tests This Month</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.testsThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSteps} total steps
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.costThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            <TrendingDown className="mr-1 inline h-3 w-3 text-green-600" />
            -15% vs last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 4. Flows Page

**File:** `src/app/(dashboard)/flows/page.tsx`

**Features:**
- List all flows with status
- Search and filter
- Create new flow button
- Quick run actions
- Last run timestamp

```tsx
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { FlowsTable } from '@/components/flows/flows-table'
import { SearchFlows } from '@/components/flows/search-flows'

export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Flows
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage and run your UX test flows
          </p>
        </div>

        <Button asChild>
          <Link href="/flows/new">
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Link>
        </Button>
      </div>

      <SearchFlows />

      <FlowsTable />
    </div>
  )
}
```

---

### 5. API Routes

**File:** `src/app/api/flows/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { FlowGuardRepository } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
    await repository.connect()

    const flows = await repository.getFlowsByUser(userId)

    return NextResponse.json({ flows })
  } catch (error) {
    console.error('Error fetching flows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const repository = new FlowGuardRepository(process.env.MONGODB_URI!)
    await repository.connect()

    const flowId = await repository.createFlow({
      ...body,
      userId,
      createdAt: new Date(),
    })

    return NextResponse.json({ flowId }, { status: 201 })
  } catch (error) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 6. Responsive Design

**TailwindCSS Configuration:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... shadcn color tokens
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

### 7. Authentication Setup

**Using Clerk:**

```bash
npm install @clerk/nextjs
```

**Middleware:**
```typescript
// src/middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/pricing', '/docs'],
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

---

## Environment Variables

```bash
# .env.local

# MongoDB
MONGODB_URI=mongodb+srv://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Acceptance Criteria

- [ ] Landing page is visually stunning
- [ ] Dashboard loads all stats correctly
- [ ] Flows page lists all user flows
- [ ] Reports page displays test results
- [ ] Analytics page shows charts and trends
- [ ] Settings page allows profile updates
- [ ] Authentication works (sign in/up/out)
- [ ] Mobile responsive (tested 320px-2560px)
- [ ] Dark mode works perfectly
- [ ] Loading states on all pages
- [ ] Error handling with toast notifications
- [ ] API routes connect to MongoDB
- [ ] Production deployment successful

---

## Dependencies

**Depends on:**
- Agent A1 (MongoDB Core) - For API integration

**Integrates with:**
- All agents - Displays data from all modules

---

## Package.json

```json
{
  "name": "@flowguard/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@clerk/nextjs": "^5.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "mongodb": "^6.3.0",
    "recharts": "^2.10.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  }
}
```

---

## Quick Start

```bash
# Create Next.js app
cd apps
npx create-next-app@latest web --typescript --tailwind --app --src-dir

# Install shadcn/ui
npx shadcn-ui@latest init

# Install components
npx shadcn-ui@latest add button card dialog table

# Install Clerk
npm install @clerk/nextjs

# Start development
cd web
npm run dev
```

---

## Success Metrics

- ✅ Lighthouse score >90 (all categories)
- ✅ First Contentful Paint <1.5s
- ✅ Mobile responsive on all devices
- ✅ Zero console errors
- ✅ Production deployment successful
- ✅ "Wow!" reaction from judges

**This is the face of FlowGuard - make it STUNNING!** ✨
