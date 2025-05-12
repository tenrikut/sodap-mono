"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

// Mock data for stores
const mockStores = [
  { id: "store1", name: "Fashion Outlet", owner: "John Smith", admins: 3, products: 128, status: "active" },
  { id: "store2", name: "Tech Haven", owner: "Sarah Johnson", admins: 2, products: 76, status: "active" },
  { id: "store3", name: "Home Goods", owner: "Michael Brown", admins: 4, products: 210, status: "active" },
  { id: "store4", name: "Sports Center", owner: "Emily Davis", admins: 1, products: 45, status: "inactive" },
  { id: "store5", name: "Jewelry Boutique", owner: "Robert Wilson", admins: 2, products: 89, status: "active" },
];

export default function PlatformAdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stores, setStores] = useState(mockStores);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stores");

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleStoreLogin = (storeId: string) => {
    // In a real app, this would authenticate the platform admin as a store admin
    // For demo purposes, we'll just navigate to the store admin dashboard
    router.push(`/store-admin/dashboard?storeId=${storeId}&role=manager&platformAdmin=true`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Platform Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-indigo-200">Welcome, Admin</span>
              <button
                onClick={() => { logout(); router.push('/dashboard'); }}
                className="bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("stores")}
              className={`pb-4 px-1 relative ${
                activeTab === "stores"
                  ? "text-indigo-600 font-medium border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Stores
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`pb-4 px-1 relative ${
                activeTab === "admins"
                  ? "text-indigo-600 font-medium border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Platform Admins
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 px-1 relative ${
                activeTab === "settings"
                  ? "text-indigo-600 font-medium border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Platform Settings
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "stores" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Manage Stores</h2>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Add New Store
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admins
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
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
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.owner}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.admins}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.products}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            store.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {store.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleStoreLogin(store.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Login as Admin
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 mr-4">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
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

        {activeTab === "admins" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Administrators</h2>
            <p className="text-gray-600">
              This section allows you to manage platform administrators. You can add, edit, or remove admin accounts.
            </p>
            <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">Admin management interface would be implemented here</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Settings</h2>
            <p className="text-gray-600">
              Configure global platform settings, including security, appearance, and functionality.
            </p>
            <div className="mt-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">Platform settings interface would be implemented here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
