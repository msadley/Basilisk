import { Icon } from "@iconify/react";
import { useConnectionStore } from "../../stores/ConnectionStore";
import styles from "./Reconnecting.module.css";

const Reconnecting = () => {
  const isConnectedToRelay = useConnectionStore(
    (state) => state.isConnectedToRelay,
  );

  return (
    !isConnectedToRelay && (
      <div className={styles.cover}>
        <div className={styles.iconWrapper}>
          <Icon icon="mingcute:loading-3-fill" />
          <p>Estabelecendo conexão com o servidor...</p>
        </div>
      </div>
    )
  );
};

export default Reconnecting;
