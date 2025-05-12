"use client";

import { useState } from "react";

interface StoreScanProps {
  onStoreScanned: (storeId: string) => void;
}

export default function StoreScan({ onStoreScanned }: StoreScanProps) {
  const [qrInput, setQrInput] = useState("");
  const [error, setError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);

  // In a real app, this would use a camera library like react-qr-reader
  // For this demo, we'll use a manual input field

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrInput.trim()) {
      setError("Please enter a store ID");
      return;
    }

    // In a real app, validate the store ID format
    if (qrInput.length < 4) {
      setError("Invalid store ID format");
      return;
    }

    setError("");
    onStoreScanned(qrInput);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-3">Scan Store QR Code</h3>

      {!isCameraActive ? (
        <>
          <p className="text-gray-600 mb-4">
            Scan a QR code to identify the store where you are shopping.
          </p>

          <div className="mb-4">
            <button
              onClick={() => setIsCameraActive(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition"
            >
              Activate Camera
            </button>
          </div>

          <div className="text-center text-gray-500 my-2">- or -</div>

          <form onSubmit={handleManualSubmit}>
            <div className="mb-3">
              <label
                htmlFor="storeId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Store ID Manually
              </label>
              <input
                type="text"
                id="storeId"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter store ID from QR code"
              />
            </div>

            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
            >
              Enter Store
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-4 bg-gray-100 flex items-center justify-center">
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
