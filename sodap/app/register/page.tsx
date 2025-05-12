"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserRole = "end_user" | "store_owner" | "store_admin";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "end_user" as UserRole,
    storeId: "", // For store admins
    walletAddress: "", // Optional for end users
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.role === "store_admin" && !formData.storeId) {
      setError("Store ID is required for store admin registration");
      return;
    }

    // Here you would typically call your API to register the user
    console.log("Registration attempt with:", formData);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md p-8 space-y-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">
            Create Account
          </h1>
          <p className="text-purple-600 text-lg">Join SoDap Today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <select
                id="role"
                name="role"
                required
                className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="end_user">End User (Shopper)</option>
                <option value="store_owner">Store Owner</option>
                <option value="store_admin">Store Admin</option>
              </select>
            </div>
            {formData.role === "store_admin" && (
              <div>
                <input
                  id="storeId"
                  name="storeId"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Store ID"
                  value={formData.storeId}
                  onChange={handleChange}
                />
              </div>
            )}
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            {formData.role === "end_user" && (
              <div>
                <input
                  id="walletAddress"
                  name="walletAddress"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Wallet Address (Optional)"
                  value={formData.walletAddress}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-200"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-purple-600">
          <p>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-purple-700 hover:text-purple-800"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
