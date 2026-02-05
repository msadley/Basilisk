import { Icon } from "@iconify/react";
import styles from "./Loading.module.css";

const Loading = () => {
  return (
    <div className={styles.cover}>
      <div className={styles.iconWrapper}>
        <Icon icon="mingcute:loading-3-fill" />
      </div>
    </div>
  );
};

export default Loading;
