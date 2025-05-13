// Re-export the IDL from the generated Anchor files
import type { Sodap } from "./sodap";
import idlJson from "./sodap.json";

// Export the raw IDL and its type
export const IDL = idlJson;
export type Idl = Sodap;
// Only export the type, not the value
export type { Sodap };

// Program ID must match what's in the Rust code
export const PROGRAM_ID = "4eLJ3QGiNrPN6UUr2fNxq6tUZqFdBMVpXkL2MhsKNriv";
