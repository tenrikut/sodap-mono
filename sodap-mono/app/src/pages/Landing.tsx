import React from 'react';
import ErrorBoundary from '@/components/debug/ErrorBoundary';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StoresSection from '@/components/landing/StoresSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Landing: React.FC = () => {


  return (
    <div className="flex flex-col min-h-screen">

      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <FeaturesSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <StoresSection />
      </ErrorBoundary>

      <ErrorBoundary>
        <CTASection />
      </ErrorBoundary>

      <ErrorBoundary>
        <Footer />
      </ErrorBoundary>
    </div>
  );
};

export default Landing;
