
export interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}
