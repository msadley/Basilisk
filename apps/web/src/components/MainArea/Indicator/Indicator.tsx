import { connectionStore } from "../../../stores/ConnectionStore";
import styles from "./Indicator.module.css";
import { observer } from "mobx-react-lite";

const Indicator = observer(() => {
  const indicatorState = connectionStore.isConnected;

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        {indicatorState ? "Conectado" : "Desconectado"}
      </div>
      <div
        className={styles.indicator}
        style={{
          backgroundColor: indicatorState
            ? "var(--ctp-green)"
            : "var(--ctp-red)",
        }}
      ></div>
    </div>
  );
});

export default Indicator;
