"use client";

import { useState, useContext } from "react";
import { SodapContext } from "../../contexts/SodapContext";

interface AddProductProps {
  onCancel: () => void;
  onSubmit?: () => void;
  isOpen?: boolean;
}

export default function AddProduct({ onCancel, onSubmit, isOpen }: AddProductProps) {
  const { addProduct } = useContext(SodapContext);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productInventory, setProductInventory] = useState("");
  const [productImage, setProductImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await addProduct({
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice),
        inventory: parseInt(productInventory, 10),
        imageUrl: productImage,
        isActive: true,
        tokenizedType: "None",
      });
      if (onSubmit) {
        onSubmit();
      }
      onCancel(); // Return to product list after successful add
    } catch (error) {
      setError("Failed to add product. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Add New Product</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="productName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="productDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Description
          </label>
          <textarea
            id="productDescription"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="productPrice"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price (SOL)
            </label>
            <input
              type="number"
              id="productPrice"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="productInventory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Inventory
            </label>
            <input
              type="number"
              id="productInventory"
              value={productInventory}
              onChange={(e) => setProductInventory(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="productImage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Image URL
          </label>
          <input
            type="url"
            id="productImage"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
