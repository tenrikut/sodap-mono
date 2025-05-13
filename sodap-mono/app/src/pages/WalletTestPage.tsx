import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import WalletTest from "../components/WalletTest";
import { Button } from "@/components/ui/button";

const WalletTestPage: React.FC = () => {
  const [showDebuggingInfo, setShowDebuggingInfo] = useState(false);

  return (
    <Layout role="end_user">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Solana Wallet Test Page
        </h1>

        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">
              How to use this test page:
            </h2>
            <ol className="list-decimal pl-6 space-y-2 text-blue-700">
              <li>
                Make sure your <strong>Phantom wallet extension</strong> is
                installed and unlocked
              </li>
              <li>
                Click <strong>Connect Wallet</strong> to connect to Phantom
              </li>
              <li>
                Once connected, you can check your balance or test transaction
                functions
              </li>
              <li>
                If you encounter any issues, check the debugging information
                below
              </li>
            </ol>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowDebuggingInfo(!showDebuggingInfo)}
            className="mb-4 w-full"
          >
            {showDebuggingInfo ? "Hide" : "Show"} Debugging Information
          </Button>

          {showDebuggingInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm font-mono overflow-auto">
              <h3 className="font-bold mb-2">Wallet Extension Info:</h3>
              <p>
                Phantom Available:{" "}
                {typeof window !== "undefined" && !!window.phantom
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                Phantom Solana Provider:{" "}
                {typeof window !== "undefined" && !!window.phantom?.solana
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                Is Phantom:{" "}
                {typeof window !== "undefined" &&
                !!window.phantom?.solana?.isPhantom
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                Secure Context:{" "}
                {typeof window !== "undefined" && window.isSecureContext
                  ? "Yes"
                  : "No"}
              </p>

              <h3 className="font-bold mt-4 mb-2">Environment Info:</h3>
              <p>
                Solana Endpoint:{" "}
                {import.meta.env.VITE_SOLANA_NETWORK || "Not set in .env"}
              </p>
              <p>
                Program ID:{" "}
                {import.meta.env.VITE_PROGRAM_ID ||
                  "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv"}
              </p>
              <p>
                Development Mode:{" "}
                {import.meta.env.DEV ? "Yes" : "No"}
              </p>
            </div>
          )}
        </div>

        <WalletTest />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Having problems with your wallet? Try these steps:</p>
          <ol className="text-left max-w-md mx-auto mt-2 space-y-1">
            <li>1. Make sure your Phantom wallet is unlocked</li>
            <li>2. Try refreshing the page and reconnecting</li>
            <li>3. Disable and re-enable the Phantom extension</li>
            <li>4. Check your browser console for specific error messages</li>
            <li>5. Make sure the Solana validator is running (port 8999)</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default WalletTestPage;
