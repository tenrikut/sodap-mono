"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [storeRole, setStoreRole] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/marketplace");
    }
  }, [isAuthenticated, router]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await login(username, password);
      if (success) {
        router.push("/marketplace");
      } else {
        setError("Your SoDap ID or password was incorrect.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        background: "linear-gradient(to bottom right, #dbeafe, #fff, #bfdbfe)",
        zIndex: 9999,
      }}
    >
      {/* Card */}
      <div className="bg-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] rounded-[2.5rem] px-10 py-14 flex flex-col items-center justify-center max-w-sm w-full min-h-[520px] backdrop-blur-xl border border-blue-100 animate-fade-in">
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
            SoDap
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <p className="text-base text-gray-400 font-normal">
            Sign in with SoDap Account
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-xs mx-auto flex flex-col items-center">
          <form
            onSubmit={handleLogin}
            className="w-full flex flex-col gap-5 mb-2"
          >
            {selectedRole === "store" && (
              <div className="flex gap-3 mb-2">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-base font-medium transition-all ${
                    storeRole === "manager"
                      ? "bg-blue-200 text-blue-800"
                      : "bg-blue-50 text-blue-500"
                  }`}
                  onClick={() => setStoreRole("manager")}
                >
                  Store Manager
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-base font-medium transition-all ${
                    storeRole === "staff"
                      ? "bg-blue-200 text-blue-800"
                      : "bg-blue-50 text-blue-500"
                  }`}
                  onClick={() => setStoreRole("staff")}
                >
                  Store Staff
                </button>
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 text-base"
              autoComplete="username"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 text-base"
              autoComplete="current-password"
              required
            />
            {error && (
              <div className="text-red-500 text-sm text-center font-medium">
                {error}
              </div>
            )}
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

          <div className="text-center">
            <Link
              href="/register"
              className="text-[15px] text-blue-500 hover:underline font-medium"
            >
              Create a SoDap Account
            </Link>
          </div>
          {/* Demo credentials */}
          <div className="mt-8 text-center text-xs text-gray-400"></div>
        </div>
      </div>
      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 0,
          width: "100vw",
          textAlign: "center",
          fontSize: 11,
          color: "#6b7280",
          zIndex: 10000,
        }}
      >
        <p>Copyright 2025 SoDap Inc. All rights reserved.</p>
      </div>
    </div>
  );
}
