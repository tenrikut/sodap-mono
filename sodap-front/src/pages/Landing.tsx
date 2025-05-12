import React, { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/debug/ErrorBoundary';
import DebugOutput from '@/components/debug/DebugOutput';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StoresSection from '@/components/landing/StoresSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const Landing: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({
    initialized: false,
    renderTime: new Date().toISOString(),
  });

  useEffect(() => {
    // Gather diagnostic information about the environment
    try {
      setDebugInfo({
        initialized: true,
        renderTime: new Date().toISOString(),
        windowDimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error gathering debug info:', error);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Debug information - only visible during development */}
      {import.meta.env.DEV && (
        <DebugOutput title="Landing Page Debug Info" data={debugInfo} />
      )}

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
