"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

// Mock data for products
const mockProducts = [
  { id: "p1", name: "Premium T-Shirt", category: "Clothing", price: 29.99, stock: 150, status: "active" },
  { id: "p2", name: "Wireless Headphones", category: "Electronics", price: 89.99, stock: 42, status: "active" },
  { id: "p3", name: "Leather Wallet", category: "Accessories", price: 49.99, stock: 78, status: "active" },
  { id: "p4", name: "Smart Watch", category: "Electronics", price: 199.99, stock: 15, status: "active" },
  { id: "p5", name: "Running Shoes", category: "Footwear", price: 79.99, stock: 0, status: "out_of_stock" },
];

// Mock data for store staff
const mockStaff = [
  { id: "staff1", name: "Alice Johnson", email: "alice@example.com", role: "manager", status: "active" },
  { id: "staff2", name: "Bob Smith", email: "bob@example.com", role: "staff", status: "active" },
  { id: "staff3", name: "Carol Williams", email: "carol@example.com", role: "staff", status: "active" },
  { id: "staff4", name: "David Brown", email: "david@example.com", role: "staff", status: "inactive" },
];

// Product form initial state
const initialProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  status: "active",
};

// Staff form initial state
const initialStaffForm = {
  name: "",
  email: "",
  role: "staff",
  status: "active",
};

export default function StoreAdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  
  // Get role from URL params (manager or staff)
  const userRole = searchParams.get("role") || "staff";
  const isPlatformAdmin = searchParams.get("platformAdmin") === "true";
  
  // State for products and staff
  const [products, setProducts] = useState(mockProducts);
  const [staff, setStaff] = useState(mockStaff);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [activeTab, setActiveTab] = useState("products");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);
  
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [staffForm, setStaffForm] = useState(initialStaffForm);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Product form handlers
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: name === "price" || name === "stock" ? parseFloat(value) || "" : value,
    });
  };

  const resetProductForm = () => {
    setProductForm(initialProductForm);
    setCurrentProduct(null);
    setIsAddingProduct(false);
    setIsEditingProduct(false);
  };

  const handleAddProduct = () => {
    setIsAddingProduct(true);
    resetProductForm();
  };

  const handleEditProduct = (product) => {
    setIsEditingProduct(true);
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      status: product.status,
    });
  };

  const handleDeleteProduct = (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    
    if (isEditingProduct && currentProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === currentProduct.id ? { ...p, ...productForm } : p
      ));
    } else {
      // Add new product
      const newProduct = {
        id: `p${products.length + 1}`,
        ...productForm,
      };
      setProducts([...products, newProduct]);
    }
    
    resetProductForm();
  };

  // Staff form handlers
  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm({
      ...staffForm,
      [name]: value,
    });
  };

  const resetStaffForm = () => {
    setStaffForm(initialStaffForm);
    setCurrentStaff(null);
    setIsAddingStaff(false);
    setIsEditingStaff(false);
  };

  const handleAddStaff = () => {
    setIsAddingStaff(true);
    resetStaffForm();
  };

  const handleEditStaff = (staffMember) => {
    setIsEditingStaff(true);
    setCurrentStaff(staffMember);
    setStaffForm({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      status: staffMember.status,
    });
  };

  const handleDeleteStaff = (staffId) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      setStaff(staff.filter(s => s.id !== staffId));
    }
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    
    if (isEditingStaff && currentStaff) {
      // Update existing staff
      setStaff(staff.map(s => 
        s.id === currentStaff.id ? { ...s, ...staffForm } : s
      ));
    } else {
      // Add new staff
      const newStaff = {
        id: `staff${staff.length + 1}`,
        ...staffForm,
      };
      setStaff([...staff, newStaff]);
    }
    
    resetStaffForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">

              <div>
                <h1 className="text-2xl font-bold">Store Dashboard</h1>
                <p className="text-blue-200 text-sm">
                  {userRole === "manager" ? "Store Manager" : "Store Staff"} Access
                  {isPlatformAdmin && " (Platform Admin)"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isPlatformAdmin ? (
                <Link 
                  href="/platform-admin/dashboard" 
                  className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Back to Platform Admin
                </Link>
              ) : null}
              <button
                onClick={() => { logout(); router.push('/dashboard'); }}
                className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs - Only show Staff tab for managers */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-4 px-1 relative ${
                activeTab === "products"
                  ? "text-blue-600 font-medium border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Products
            </button>
            
            {/* Only show Staff tab for managers */}
            {userRole === "manager" && (
              <button
                onClick={() => setActiveTab("staff")}
                className={`pb-4 px-1 relative ${
                  activeTab === "staff"
                    ? "text-blue-600 font-medium border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Store Staff
              </button>
            )}
            
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-4 px-1 relative ${
                activeTab === "analytics"
                  ? "text-blue-600 font-medium border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Manage Products</h2>
              <button 
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add New Product
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : isAddingProduct || isEditingProduct ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isEditingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <form onSubmit={handleProductSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name</label>
                      <input
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={handleProductFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        name="category"
                        value={productForm.category}
                        onChange={handleProductFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={productForm.price}
                        onChange={handleProductFormChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={productForm.stock}
                        onChange={handleProductFormChange}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={productForm.status}
                        onChange={handleProductFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isEditingProduct ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : product.status === "out_of_stock" 
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {product.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Staff Tab - Only visible to managers */}
        {activeTab === "staff" && userRole === "manager" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Manage Store Staff</h2>
              <button 
                onClick={handleAddStaff}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add New Staff
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : isAddingStaff || isEditingStaff ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isEditingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                </h3>
                <form onSubmit={handleStaffSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={staffForm.name}
                        onChange={handleStaffFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={staffForm.email}
                        onChange={handleStaffFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        name="role"
                        value={staffForm.role}
                        onChange={handleStaffFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="manager">Store Manager</option>
                        <option value="staff">Store Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        value={staffForm.status}
                        onChange={handleStaffFormChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetStaffForm}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isEditingStaff ? "Update Staff" : "Add Staff"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.map((staffMember) => (
                      <tr key={staffMember.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{staffMember.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            staffMember.role === "manager" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {staffMember.role === "manager" ? "Store Manager" : "Store Staff"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            staffMember.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {staffMember.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditStaff(staffMember)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staffMember.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Store Analytics</h2>
            <p className="text-gray-600">
              View performance metrics and insights for your store.
            </p>
            <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">Analytics dashboard would be implemented here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
