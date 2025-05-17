import { FC, PropsWithChildren } from "react";
import { SodapAnchorProvider } from "./contexts/AnchorContext";
import { SolanaProvider } from "./components/providers/SolanaProvider";

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SolanaProvider>
      <SodapAnchorProvider>{children}</SodapAnchorProvider>
    </SolanaProvider>
  );
};
