
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Experience Web3 Shopping?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of others who are already enjoying the benefits of decentralized commerce.
        </p>
        <Link to="/signup">
          <Button className="bg-sodap-purple hover:bg-sodap-purple/90 text-white px-8 py-6 text-lg">
            Get Started Today
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
