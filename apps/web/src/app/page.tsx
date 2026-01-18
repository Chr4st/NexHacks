import { HeroSection } from '@/components/marketing/hero';
import { FeaturesSection } from '@/components/marketing/features';
import { PricingSection } from '@/components/marketing/pricing';
import { CTASection } from '@/components/marketing/cta';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}

