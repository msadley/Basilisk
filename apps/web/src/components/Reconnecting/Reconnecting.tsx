import { Icon } from "@iconify/react";
import styles from "./Reconnecting.module.css";
import { useConnectionStore } from "../../stores/ConnectionStore";

const Reconnecting = () => {
  const isUserConnected = useConnectionStore((state) => state.isUserConnected);

  return (
    !isUserConnected && (
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
