
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-16 md:py-32">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-sodap-purple">Shop</span> On-Chain<br />
              Walk Out <span className="text-sodap-blue">Free</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              SoDap connects Solana with everyday shopping. Fast, secure, rewarding.
            </p>
            <div className="flex space-x-4">
              <Link to="/signup">
                <Button className="bg-sodap-purple hover:bg-sodap-purple/90 text-white px-6 py-2">
                  Get Started <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -left-6 -top-6 w-64 h-64 bg-purple-100 rounded-full"></div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-100 rounded-full"></div>
              <div className="relative z-10 w-full h-80 bg-gradient-to-r from-sodap-purple to-sodap-blue rounded-xl shadow-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
