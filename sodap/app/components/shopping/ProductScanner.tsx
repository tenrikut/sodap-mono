"use client";

import { useState, useContext, useEffect } from "react";
import { SodapContext } from "../../contexts/SodapContext";
import { useShoppingCart } from "../../contexts/ShoppingCartContext";

interface ProductScannerProps {
  storeId: string;
}

export default function ProductScanner({ storeId }: ProductScannerProps) {
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getProducts } = useContext(SodapContext);
  const { addToCart } = useShoppingCart();

  // Load available products for the store
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProducts();
        setAvailableProducts(products);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [getProducts, storeId]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productCode.trim()) {
      setError("Please enter a product code");
      setSuccess("");
      return;
    }

    // Find product in available products
    const product = availableProducts.find(
      (p) =>
        p.id === productCode || p.id.toLowerCase() === productCode.toLowerCase()
    );

    if (!product) {
      setError("Product not found. Please check the code and try again.");
      setSuccess("");
      return;
    }

    // Check if product has inventory
    if (product.inventory < quantity) {
      setError(`Sorry, only ${product.inventory} units available.`);
      setSuccess("");
      return;
    }

    // Add to cart
    addToCart(product, quantity);
    setSuccess(`Added ${quantity} × ${product.name} to cart`);
    setError("");

    // Reset form
    setProductCode("");
    setQuantity(1);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  // Function to handle quick add for demo purposes
  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    setSuccess(`Added 1 × ${product.name} to cart`);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading products...</div>;
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      {!isCameraActive ? (
        <>
          <form onSubmit={handleManualSubmit} className="mb-6">
            <div className="mb-3">
              <label
                htmlFor="productCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Product Code
              </label>
              <input
                type="text"
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Product code or UUID"
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            {success && (
              <div className="text-green-500 text-sm mb-3">{success}</div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={() => setIsCameraActive(true)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition"
              >
                Scan with Camera
              </button>
            </div>
          </form>

          <div>
            <h4 className="text-md font-medium mb-2">Quick Add Products:</h4>
            <div className="grid grid-cols-1 gap-2">
              {availableProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-md p-2 flex justify-between items-center hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleQuickAdd(product)}
                >
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded-full mr-2"
                      />
                    )}
                    <span>{product.name}</span>
                  </div>
                  <span className="text-blue-600 font-medium">
                    {product.price} SOL
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-12 mb-4 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">
              Camera would be active here in a real app.
            </p>
          </div>

          <button
            onClick={() => setIsCameraActive(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            Cancel Scanning
          </button>
        </div>
      )}
    </div>
  );
}
