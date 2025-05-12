"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreSetup from "../components/store/StoreSetup";
import ProductList from "../components/store/ProductList";
import AddProduct from "../components/store/AddProduct";
import { SodapContext } from "../contexts/SodapContext";
import { motion } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("products");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"platform" | "store" | null>(
    null
  );
  const [storeRole, setStoreRole] = useState<"manager" | "staff">("manager");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: "platform" | "store") => {
    setSelectedRole(role);
    setError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate authentication based on selected role
    setTimeout(() => {
      if (selectedRole === "platform") {
        // Platform admin login
        if (username === "admin" && password === "adminpass") {
          router.push("/platform-admin/dashboard");
        } else {
          setError("Invalid platform administrator credentials.");
          setIsLoading(false);
        }
      } else if (selectedRole === "store") {
        // Store admin login
        if (
          (storeRole === "manager" &&
            username === "manager" &&
            password === "managerpass") ||
          (storeRole === "staff" &&
            username === "staff" &&
            password === "staffpass")
        ) {
          router.push(`/store-admin/dashboard?role=${storeRole}`);
        } else {
          setError("Invalid store administrator credentials.");
          setIsLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(to bottom right, #dbeafe, #fff, #bfdbfe)",
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm w-full flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] rounded-[2.5rem] px-10 py-14 flex flex-col items-center justify-center backdrop-blur-xl border border-blue-100 animate-fade-in"
          >
            {/* Logo */}
            <div className="mb-10 flex flex-col items-center">
              <div
                style={{
                  color: "#a78bfa",
                  fontWeight: 700,
                  fontSize: 80,
                  marginBottom: 8,
                }}
              >
            </div>
          </div>
          {/* Title and Role Select */}
          <div className="w-full max-w-xs mx-auto flex flex-col items-center">
            <div className="flex flex-col w-full gap-3 mb-8">
              <button
                className={`w-full py-3 rounded-xl font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${selectedRole === "platform" ? "bg-blue-400 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"}`}
                onClick={() => handleRoleSelect("platform")}
                type="button"
              >
                Platform Administrator
              </button>
              <button
                className={`w-full py-3 rounded-xl font-medium text-base transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${selectedRole === "store" ? "bg-blue-400 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"}`}
                onClick={() => handleRoleSelect("store")}
                type="button"
              >
                Store Administrator
              </button>
            </div>
            {selectedRole === "store" && (
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-base font-medium transition-all ${storeRole === "manager" ? "bg-blue-200 text-blue-800" : "bg-blue-50 text-blue-500"}`}
                  onClick={() => setStoreRole("manager")}
                >
                  Store Manager
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-base font-medium transition-all ${storeRole === "staff" ? "bg-blue-200 text-blue-800" : "bg-blue-50 text-blue-500"}`}
                  onClick={() => setStoreRole("staff")}
                >
                  Store Staff
                </button>
              </div>
            )}
            <form onSubmit={handleLogin}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full py-3 rounded-lg text-base font-medium text-gray-700 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full py-3 rounded-lg text-base font-medium text-gray-700 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full py-4 mt-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg focus:ring-2 focus:ring-blue-300 mx-auto"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
            {/* Demo credentials */}
            <div className="mt-8 text-center text-xs text-gray-400">
              <p>
                {selectedRole === "platform" ? (
                  <>
                    <span className="font-medium">Demo:</span> admin / adminpass
                  </>
                ) : selectedRole === "store" ? (
                  storeRole === "manager" ? (
                    <>
                      <span className="font-medium">Demo:</span> manager / managerpass
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Demo:</span> staff / staffpass
                    </>
                  )
                ) : null}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
