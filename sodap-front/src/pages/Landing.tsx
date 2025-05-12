
import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StoresSection from '@/components/landing/StoresSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <StoresSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Landing;
