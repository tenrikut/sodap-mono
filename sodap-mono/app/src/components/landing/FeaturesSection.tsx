
import React from 'react';
import { ShoppingCart, Store, User } from 'lucide-react';
import FeatureCard from './FeatureCard';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose SoDap?</h2>
        
        <div className="grid md:grid-cols-3 gap-10">
          <FeatureCard 
            icon={ShoppingCart} 
            iconColor="bg-sodap-purple/10" 
            title="Instant Checkout" 
            description="Pay with SOL and complete purchases in seconds with instant confirmations."
          />
          
          <FeatureCard 
            icon={Store} 
            iconColor="bg-sodap-blue/10" 
            title="Transparent Transactions" 
            description="All transactions are recorded on the Solana blockchain for complete transparency and security."
          />
          
          <FeatureCard 
            icon={User} 
            iconColor="bg-sodap-purple/10" 
            title="Secure Escrow" 
            description="Shop with confidence knowing funds are secure until your purchase is complete."
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
