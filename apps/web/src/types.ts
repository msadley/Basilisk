import type { ReactNode } from "react";

export type View = {
  type: string;
  id?: string;
  name?: string;
};

export interface ViewProps {
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
  setLeftPanel: (element: ReactNode) => void;
  setRightPanel: (element: ReactNode) => void;
}

export interface ButtonProps {
  onClick: () => void;
}
