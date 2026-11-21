import { Icon } from "@iconify/react";
import { useConnectionStore } from "../../stores/ConnectionStore";
import { rootStore, useStartupStore } from "../../stores/RootStore";
import styles from "./Reconnecting.module.css";

const Reconnecting = () => {
  const isConnectedToRelay = useConnectionStore(
    (state) => state.isConnectedToRelay,
  );
  const startupStatus = useStartupStore((state) => state.status);
  const startupError = useStartupStore((state) => state.error);

  if (isConnectedToRelay && startupStatus !== "error") {
    return null;
  }

  const isError = startupStatus === "error";

  return (
    <div className={styles.cover} role={isError ? "alert" : "status"}>
      <div className={styles.iconWrapper}>
        {isError ? (
          <>
            <Icon icon="mingcute:alert-fill" className={styles.errorIcon} />
            <p className={styles.errorTitle}>
              Não foi possível conectar ao servidor.
            </p>
            {startupError?.message && (
              <p className={styles.errorDetail}>{startupError.message}</p>
            )}
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void rootStore.init()}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <Icon icon="mingcute:loading-3-fill" className={styles.spinner} />
            <p>Estabelecendo conexão com o servidor...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Reconnecting;
