
import React from 'react';
import { Button } from '@/components/ui/button';
import { MinusIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (id: string, change: number) => void;
  removeItem: (id: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, updateQuantity, removeItem }) => {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <div className="w-16 h-16 overflow-hidden rounded">
        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{item.product.name}</h3>
        <p className="text-sm text-muted-foreground">{item.product.price} SOL</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline" 
          size="icon"
          onClick={() => updateQuantity(item.product.id, -1)}
        >
          <MinusIcon className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button
          variant="outline" 
          size="icon"
          onClick={() => updateQuantity(item.product.id, 1)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-20 text-right font-medium">
        {(item.product.price * item.quantity).toFixed(3)} SOL
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => removeItem(item.product.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
