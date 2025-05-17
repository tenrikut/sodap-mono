
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  iconColor, 
  title, 
  description 
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className={`w-12 h-12 ${iconColor || 'bg-purple-100'} rounded-full flex items-center justify-center mb-6`}>
        <Icon className="text-purple-500" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default FeatureCard;
