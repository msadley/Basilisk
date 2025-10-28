import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
  useEffect,
} from "react";
import type { View } from "../types";
import { worker } from "../worker/client";
import type { SystemEvent } from "@basilisk/core";

interface LayoutContextType {
  onView: View;
  onViewChange: (view: View) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [onView, onViewChange] = useState<View>({ type: "welcome" });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<SystemEvent>) => {
      const { type, payload } = event.data;

      switch (type) {
        case "chat-created":
          onViewChange({ type: "chat", id: payload.chat.id });
          break;

        default:
          break;
      }
    };

    worker.addEventListener("message", handleMessage);

    return () => {
      worker.removeEventListener("message", handleMessage);
    };
  }, []);

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
