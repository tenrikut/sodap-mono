
import React from 'react';
import StoreCard from './StoreCard';

const StoresSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-6">Featured Stores</h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Discover our partner stores and enjoy exclusive SoDap rewards when you shop with them.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          <StoreCard
            id="cafe"
            name="SoDap Cafe"
            description="Specialty coffee, pastries, and healthy bites. Earn 5% back in SoDap rewards on every purchase."
            imageUrl="https://images.unsplash.com/photo-1559925393-8be0ec4767c8"
            iconColor="bg-sodap-purple/10"
            linkColor="text-sodap-purple"
          />
          
          <StoreCard
            id="lidl"
            name="SoDap Lidl"
            description="Groceries and household essentials at everyday low prices. Double SoDap points on weekends."
            imageUrl="https://images.unsplash.com/photo-1534723328310-e82dad3ee43f"
            iconColor="bg-sodap-blue/10"
            linkColor="text-sodap-blue"
          />
          
          <StoreCard
            id="electronics"
            name="SoDap Electronics"
            description="Latest tech gadgets and accessories with expert advice. Get 10% SoDap cashback on your first purchase."
            imageUrl="https://images.unsplash.com/photo-1550009158-9ebf69173e03"
            iconColor="bg-sodap-purple/10"
            linkColor="text-sodap-purple"
          />
        </div>
      </div>
    </section>
  );
};

export default StoresSection;
