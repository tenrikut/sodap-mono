// Re-export the IDL from the generated Anchor files
import { Sodap } from "./sodap";
import idlJson from "./sodap.json";

// We're using a direct export of the IDL JSON file
// Type compatibility with Anchor's IDL interface is handled in the anchor.ts file
export type SodapIDL = Sodap;
// Export the raw IDL
export const IDL = idlJson;

// Program ID must match what's in the Rust code
export const PROGRAM_ID = "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv";
