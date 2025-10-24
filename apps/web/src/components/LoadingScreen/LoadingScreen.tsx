import { Icon } from "@iconify/react";
import styles from "./LoadingScreen.module.css";

function LoadingScreen() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.inner}>
        <div className={styles.body}>
          <Icon icon="mingcute:loading-3-fill"></Icon>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
