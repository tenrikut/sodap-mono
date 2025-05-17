import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Function to get products based on store ID
const getProductsByStore = (storeId: string) => {
  // Products for Sodap Watch Store (store id: 5)
  if (storeId === "5") {
    return [
      {
        id: "501",
        name: "Rolex Submariner",
        price: 0.1,
        image: "/images/Rolex .png",
        description:
          "Iconic diving watch with unidirectional rotating bezel and water resistance up to 300 meters",
      },
      {
        id: "502",
        name: 'Omega Speedmaster "Moonwatch"',
        price: 0.3,
        image: "/images/omega.png",
        description:
          "The first watch worn on the moon with manual-winding chronograph movement",
      },
      {
        id: "503",
        name: "Patek Philippe Nautilus 5711/1A",
        price: 0.49,
        image: "/images/patek-philippe.png",
        description:
          "Luxury sports watch with distinctive porthole-shaped case design",
      },
      {
        id: "504",
        name: "Seiko",
        price: 0.5,
        image: "/images/seiko.png",
        description:
          "Reliable Japanese timepiece known for its quality craftsmanship and durability",
      },
      {
        id: "505",
        name: "TAG Heuer Carrera Calibre",
        price: 0.02,
        image: "/images/tag.png",
        description:
          "Racing-inspired chronograph watch with sophisticated movement and elegant design",
      },
    ];
  }

  // Default products for other stores
  return [
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
};

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

  // State for products based on selected store
  const [storeProducts, setStoreProducts] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      description: string;
    }>
  >([]);

  // State for cart
  const [cart, setCart] = useState<
    Array<{
      product: {
        id: string;
        name: string;
        price: number;
        image: string;
        description: string;
      };
      quantity: number;
    }>
  >(initialCart);
  const [currentStore, setCurrentStore] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [username, setUsername] = useState<string>("User");

  // Calculate subtotal from cart items
  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Function to navigate to payment page
  const navigateToPayment = () => {
    console.log(
      "Navigating to payment page with cart total:",
      subtotal.toFixed(3)
    );
    // Save cart details for the payment page
    sessionStorage.setItem("cartTotal", subtotal.toFixed(3));

    // Get the store ID from the URL
    const params = new URLSearchParams(location.search);
    const storeId = params.get("store");

    // Navigate to payment page with the store ID
    if (storeId) {
      // Also save to session storage as backup
      sessionStorage.setItem("selectedStoreId", storeId);
      navigate(`/payment?storeId=${storeId}`);
    } else {
      navigate("/payment");
    }
  };

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
      // Load products for this store
      setStoreProducts(getProductsByStore(storeId));
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
  const addToCart = (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {storeProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold text-lg mb-2">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-3">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{product.price} SOL</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-sodap-purple hover:bg-purple-700 text-white px-3 py-1 rounded"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Cart Summary - removed in favor of the cart icon in the header */}
      </div>
    </Layout>
  );
};

export default Shop;
