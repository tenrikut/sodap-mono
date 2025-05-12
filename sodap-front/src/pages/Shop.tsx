import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import watch images
import rolexImage from "@/images/Rolex .png";
import omegaImage from "@/images/omega.png";
import tagImage from "@/images/tag.png";
import patekImage from "@/images/patek-philippe.png";
import seikoImage from "@/images/seiko.png";

// Define a product type
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

// Mock product data - would be replaced with actual API calls
const mockProducts: Product[] = [
  {
    id: "1",
    name: "SoDap T-Shirt",
    price: 0.05,
    image: "https://placehold.co/300x300?text=SoDap+Shirt",
    description: "Comfortable cotton T-shirt with SoDap logo",
  },
  {
    id: "2",
    name: "SoDap Mug",
    price: 0.02,
    image: "https://placehold.co/300x300?text=SoDap+Mug",
    description: "Ceramic mug with SoDap logo",
  },
  {
    id: "3",
    name: "SoDap Cap",
    price: 0.03,
    image: "https://placehold.co/300x300?text=SoDap+Cap",
    description: "Adjustable cap with SoDap logo",
  },
  {
    id: "4",
    name: "SoDap Stickers",
    price: 0.01,
    image: "https://placehold.co/300x300?text=SoDap+Stickers",
    description: "Set of 5 SoDap logo stickers",
  },
];

// Watch products for Store ID 5 (Sodap Watch Store)
const watchProducts: Product[] = [
  {
    id: "w1",
    name: "Rolex Submariner Date",
    price: 36.95,
    image: rolexImage,
    description: "Ref. 116618LN, 18 kt Yellow Gold, Black Dial. Brand: Rolex",
  },
  {
    id: "w2",
    name: "Omega Speedmaster Professional Moonwatch",
    price: 6.5,
    image: omegaImage,
    description: "Ref. 310.30.42.50.01.001, Stainless Steel. Brand: Omega",
  },
  {
    id: "w3",
    name: "TAG Heuer Carrera Chronograph",
    price: 3.2,
    image: tagImage,
    description: "Ref. CV2014.FC6233, Stainless Steel. Brand: TAG Heuer",
  },
  {
    id: "w4",
    name: "Patek Philippe Nautilus 40th Anniversary",
    price: 120.0,
    image: patekImage,
    description: "Limited Edition, Platinum, Blue Dial. Brand: Patek Philippe",
  },
  {
    id: "w5",
    name: "Seiko SKX007 Diver's Watch",
    price: 0.425,
    image: seikoImage,
    description: "Automatic, Stainless Steel, Black Dial. Brand: Seiko",
  },
];

// Mock stores
const mockStores = [
  { id: "1", name: "SoDap Official Store" },
  { id: "2", name: "Digital Collectibles" },
  { id: "3", name: "Crypto Merchandise" },
  { id: "4", name: "Blockchain Apparel" },
  { id: "5", name: "Sodap Watch Store" },
];

const Shop: React.FC = () => {
  // Load cart from localStorage on initial render
  const initialCart = () => {
    const storedCart = localStorage.getItem("cart");
    try {
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Error parsing cart from localStorage", e);
      return [];
    }
  };

  // State for cart
  const [cart, setCart] =
    useState<Array<{ product: Product; quantity: number }>>(initialCart);
  const [currentStore, setCurrentStore] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [username, setUsername] = useState<string>("User");
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cart]);

  useEffect(() => {
    // Get store ID from URL parameters
    const params = new URLSearchParams(location.search);
    const storeId = params.get("store");

    if (!storeId) {
      // If no store ID is provided, redirect to store selection
      navigate("/store-selection");
      return;
    }

    // Find store by ID
    const store = mockStores.find((s) => s.id === storeId);
    if (store) {
      setCurrentStore(store);

      // Set the products to display based on store ID
      if (store.id === "5") {
        // If it's the watch store, display watch products
        setDisplayProducts(watchProducts);
      } else {
        // Otherwise display the default products
        setDisplayProducts(mockProducts);
      }
    } else {
      // If store not found, redirect to store selection
      navigate("/store-selection");
    }

    // In a real app, get the username from authentication
    // For now, let's simulate getting the user's name
    const mockUser = sessionStorage.getItem("username") || "User";
    setUsername(mockUser);
  }, [location.search, navigate]);

  // Add to cart function
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        // Item exists, update quantity
        const updatedCart = prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return updatedCart;
      } else {
        // New item
        return [...prevCart, { product, quantity: 1 }];
      }
    });

    toast.success(`${product.name} added to cart!`);
  };

  // If no store is selected yet, show loading
  if (!currentStore) {
    return (
      <Layout role="end_user">
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading store information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="end_user">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{currentStore.name}</h1>
            <Button
              onClick={() => navigate("/store-selection")}
              variant="outline"
              className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
            >
              Change Store
            </Button>
          </div>
          <div className="mt-2 text-lg text-gray-600">Welcome {username}</div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>
              <div className="p-5">
                <h2 className="font-bold text-xl mb-2">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">
                    {product.price} SOL
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-sodap-purple hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
