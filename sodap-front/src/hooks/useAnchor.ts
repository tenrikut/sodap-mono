/**
 * Hook to access the Anchor context, which provides wallet connection,
 * Solana connection, and Anchor program instance.
 */

// Re-export from the source to avoid duplicates
import { useAnchor } from "../contexts/AnchorContext";
export { useAnchor };
export default useAnchor;
