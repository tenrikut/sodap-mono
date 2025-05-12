
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface StoreCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  iconColor: string;
  linkColor: string;
}

const StoreCard: React.FC<StoreCardProps> = ({ 
  id, 
  name, 
  description, 
  imageUrl, 
  iconColor, 
  linkColor 
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <AspectRatio ratio={16/9}>
        <img 
          src={imageUrl}
          alt={name} 
          className="object-cover w-full h-full"
        />
      </AspectRatio>
      <CardContent className="pt-6">
        <div className="flex items-center mb-2">
          <div className={`w-8 h-8 ${iconColor || 'bg-purple-100'} rounded-full flex items-center justify-center mr-3`}>
            <Store className="text-purple-500" size={16} />
          </div>
          <h3 className="text-xl font-semibold">{name}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Link to={`/store?id=${id}`} className="text-purple-500 hover:underline font-medium flex items-center">
          Visit Store <ArrowRight size={16} className="ml-2" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default StoreCard;
