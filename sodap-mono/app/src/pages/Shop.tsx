import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Filter, ChevronDown, ShoppingBag, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";


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
  
  // State for filtered products
  const [filteredProducts, setFilteredProducts] = useState<
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
  
  // UI state
  const [currentStore, setCurrentStore] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [username, setUsername] = useState<string>("User");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("featured");
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cart]);

  // Load store products
  useEffect(() => {
    setIsLoading(true);
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
      const products = getProductsByStore(storeId);
      setStoreProducts(products);
      setFilteredProducts(products);
      setIsLoading(false);
    } else {
      // If store not found, redirect to store selection
      navigate("/store-selection");
    }

    // In a real app, get the username from authentication
    // For now, let's simulate getting the user's name
    const mockUser = sessionStorage.getItem("username") || "User";
    setUsername(mockUser);
  }, [location.search, navigate]);
  
  // Filter and sort products whenever search query or sort option changes
  useEffect(() => {
    if (storeProducts.length === 0) return;
    
    // First filter by search query
    let result = storeProducts;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = storeProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }
    
    // Then sort the filtered results
    switch (sortOption) {
      case "price-low-high":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name-a-z":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-z-a":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      default: // "featured" - leave in original order
        break;
    }
    
    setFilteredProducts(result);
  }, [storeProducts, searchQuery, sortOption]);

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

  // Cart sheet component
  const CartSheet = () => {
    return (
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-[350px] sm:w-[450px]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-sodap-purple flex items-center">
              <ShoppingBag className="mr-2" size={20} />
              Your Cart
              <Badge className="ml-2 bg-sodap-purple">{cart.length} items</Badge>
            </SheetTitle>
            <SheetDescription>
              Review your items before checkout
            </SheetDescription>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-gray-400 text-sm mb-6">Add some items to get started</p>
              <Button 
                variant="outline" 
                className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 py-4 border-b">
                      <div className="h-20 w-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <button 
                            onClick={() => {
                              setCart(cart.filter(i => i.product.id !== item.product.id));
                              toast.success(`${item.product.name} removed from cart`);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {item.product.description}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCart(cart.map(i => 
                                    i.product.id === item.product.id 
                                      ? { ...i, quantity: i.quantity - 1 } 
                                      : i
                                  ));
                                }
                              }}
                              className="h-6 w-6 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                setCart(cart.map(i => 
                                  i.product.id === item.product.id 
                                    ? { ...i, quantity: i.quantity + 1 } 
                                    : i
                                ));
                              }}
                              className="h-6 w-6 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-medium">{(item.product.price * item.quantity).toFixed(3)} SOL</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between py-2 border-t border-b">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">{subtotal.toFixed(3)} SOL</span>
                </div>
                <Button 
                  className="w-full bg-sodap-purple hover:bg-purple-700" 
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateToPayment();
                  }}
                >
                  Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  };

  // Loading state
  if (isLoading || !currentStore) {
    return (
      <Layout role="end_user">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="end_user">
      <CartSheet />
      <div className="container mx-auto px-4 py-6">
        {/* Store header with search and filters */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentStore.name}</h1>
              <p className="text-gray-600 mt-1">Welcome back, {username}</p>
            </div>
            <Button
              onClick={() => navigate("/store-selection")}
              variant="outline"
              className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
            >
              Change Store
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 border-gray-300 focus:border-sodap-purple focus:ring-sodap-purple"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="border-gray-300 focus:border-sodap-purple focus:ring-sodap-purple">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                  <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="md:hidden border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="mr-2" size={16} />
              Cart ({cart.length})
            </Button>
          </div>
          
          {/* Filter results summary */}
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredProducts.length} results for "{searchQuery}"
              </span>
              <Button 
                variant="ghost" 
                className="h-8 px-2 text-xs"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </Button>
            </div>
          )}
          
          <Separator />
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <Button 
              variant="outline" 
              className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
              onClick={() => {
                setSearchQuery("");
                setSortOption("featured");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group flex flex-col h-[400px]"
              >
                <div className="relative h-48 overflow-hidden bg-gray-50 flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                </div>
                <div className="p-5 flex flex-col h-[180px]">
                  <h2 className="font-medium text-lg mb-1 text-gray-900 line-clamp-1">{product.name}</h2>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
                    {product.description}
                  </p>
                  <div className="mt-auto pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{product.price} SOL</span>
                      <Button
                        onClick={() => {
                          addToCart(product);
                          setIsCartOpen(true);
                        }}
                        className="bg-sodap-purple hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Shop;
