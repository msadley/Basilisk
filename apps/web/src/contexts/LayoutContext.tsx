import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import type { View } from "../types";

interface LayoutContextType {
  onView: View;
  onViewChange: (view: View) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [onView, onViewChange] = useState<View>({ type: "welcome" });

  const value = useMemo(
    () => ({
      onView,
      onViewChange,
    }),
    [onView, onViewChange]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};
