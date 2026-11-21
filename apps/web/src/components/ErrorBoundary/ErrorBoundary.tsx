import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an unexpected error:", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="alert">
          <div className={styles.card}>
            <h1 className={styles.title}>Algo deu errado</h1>
            <p className={styles.description}>
              Ocorreu um erro inesperado na aplicação.
            </p>
            {this.state.error?.message && (
              <p className={styles.detail}>{this.state.error.message}</p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={this.handleReset}
              >
                Tentar novamente
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={this.handleReload}
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
