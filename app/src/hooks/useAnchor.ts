/**
 * Hook to access the Anchor context, which provides wallet connection,
 * Solana connection, and Anchor program instance.
 */

import { useContext } from "react";
import { AnchorContext, AnchorContextType } from "../contexts/AnchorContext.context";

// Define the hook directly here instead of re-exporting
export const useAnchor = (): AnchorContextType => useContext(AnchorContext);

export default useAnchor;
