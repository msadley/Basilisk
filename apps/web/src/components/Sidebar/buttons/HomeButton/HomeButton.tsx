import type { ButtonProps } from "../../../../types";
import styles from "./HomeButton.module.css";

function HomeButton({ onClick }: ButtonProps) {
  return (
    <div className={styles.welcomeButton} onClick={onClick}>
      <img src="/basilisk.svg" alt="logo" />
    </div>
  );
}

export default HomeButton;
