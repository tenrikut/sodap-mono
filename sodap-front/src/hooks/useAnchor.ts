import { useContext } from "react";
import {
  AnchorContext,
  AnchorContextType,
} from "../contexts/AnchorContext.context";

export const useAnchor = (): AnchorContextType => {
  const context = useContext(AnchorContext);
  if (!context) {
    throw new Error("useAnchor must be used within a SodapAnchorProvider");
  }
  return context;
};
