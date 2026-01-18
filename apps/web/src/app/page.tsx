import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              FlowGuard AI
            </h1>
            <p className="mt-6 text-xl text-blue-100 sm:text-2xl">
              AI-Native UX Testing Platform
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-50">
              Validate user flows with vision AI. Catch UX issues before your users do.
              Automated testing that understands context, not just code.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/sign-in">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to test UX
            </h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Powered by Claude Vision AI and real user metrics
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/10">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Claude Vision AI analyzes screenshots to understand context and catch UX issues that traditional tests miss.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/10">
              <Zap className="h-8 w-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Real User Metrics</h3>
              <p className="text-gray-600">
                Integrate Chrome UX Report and Wood Wide AI for statistical analysis of UX improvements.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/10">
              <Shield className="h-8 w-8 text-pink-600" />
              <h3 className="text-xl font-semibold">Production Ready</h3>
              <p className="text-gray-600">
                Beautiful HTML reports, CI/CD integration, and cloud-native storage for all your test artifacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to improve your UX?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Start testing your user flows with AI-powered validation today.
            </p>
            <div className="mt-10">
              <Link href="/sign-in">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

