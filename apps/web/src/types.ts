import type { ReactNode } from "react";

export interface ViewProps {
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
}

export interface ButtonProps {
  onClick: () => void;
}
