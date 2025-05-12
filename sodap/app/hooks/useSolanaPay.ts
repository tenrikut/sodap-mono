import { useState, useCallback, useRef, useEffect } from "react";
import { createQR, encodeURL, TransactionRequestURLFields } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import { findEscrowAddress } from "../utils/solana";

export function useSolanaPay() {
  const [qrElement, setQrElement] = useState<HTMLDivElement | null>(null);
  const qrRef = useRef<ReturnType<typeof createQR> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrElement) {
        qrElement.remove();
      }
      setQrElement(null);
      qrRef.current = null;
    };
  }, []);

  const generateQR = useCallback(
    async (storeId: PublicKey, amountSol: number, reference: PublicKey) => {
      try {
        const [escrowPda] = await findEscrowAddress(storeId);

        const url = encodeURL({
          link: new URL("https://sodap.app/pay"),
          label: "SoDap Purchase",
          message: "Purchase with escrow protection",
          memo: "SoDap Transaction",
          recipient: escrowPda,
        });

        const qr = createQR(url, 512, "transparent", "#1B1B1B");
        qrRef.current = qr;

        // Create a container element for the QR code
        const element = document.createElement("div");
        element.className = "qr-container";
        qr.append(element);
        setQrElement(element);

        return element;
      } catch (error) {
        console.error("Error generating QR code:", error);
        return null;
      }
    },
    []
  );

  const clearQR = useCallback(() => {
    if (qrElement) {
      qrElement.remove();
    }
    setQrElement(null);
    qrRef.current = null;
  }, [qrElement]);

  return {
    qrElement,
    generateQR,
    clearQR,
  };
}
