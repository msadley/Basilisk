import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { queryClient } from "./stores/queryClient";
import { rootStore, useStartupStore } from "./stores/RootStore";

void rootStore.init();

function Root() {
  const { status, error } = useStartupStore();

  if (status === "error") {
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1>Failed to initialize Basilisk</h1>
        <p>{error?.message ?? "Unexpected startup error."}</p>
        <button type="button" onClick={() => void rootStore.init()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
