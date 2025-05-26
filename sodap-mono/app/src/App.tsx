import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Providers } from "./providers";
import { SodapAnchorProvider } from "./contexts/AnchorContext";
import { SolanaProvider } from "./components/providers/SolanaProvider";
import WalletTestPage from "./pages/WalletTestPage";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import Store from "./pages/Store";
import StoreSelection from "./pages/StoreSelection";
import StoreDetail from "./pages/StoreDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Providers>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/store-selection" element={<StoreSelection />} />

            {/* Wallet Test Route */}
            <Route path="/wallet-test" element={<WalletTestPage />} />

            {/* User Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/:storeId" element={<StoreDetail />} />

            {/* Dashboard Routes - Role based */}
            <Route path="/dashboard" element={<Dashboard role="end_user" />} />
            <Route
              path="/dashboard/admin"
              element={<Dashboard role="platform_admin" />}
            />
            <Route
              path="/dashboard/manager"
              element={<Dashboard role="store_manager" />}
            />
            <Route
              path="/dashboard/staff"
              element={<Dashboard role="store_staff" />}
            />
            <Route
              path="/dashboard/settings"
              element={<Dashboard role="store_manager" />}
            />
            <Route
              path="/dashboard/admin-info"
              element={<Dashboard role="platform_admin" />}
            />
            <Route
              path="/dashboard/refunds"
              element={<Dashboard role="store_manager" />}
            />
            <Route
              path="/dashboard/products"
              element={<Dashboard role="store_manager" />}
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Providers>
  </QueryClientProvider>
);

export default App;
