import { Icon } from "@iconify/react";
import styles from "./SettingsButton.module.css";
import type { ButtonProps } from "../../../../types";

function SettingsButton({ onClick }: ButtonProps) {
  return (
    <button className={styles.settingsButton} onClick={onClick}>
      <Icon icon="mingcute:settings-1-fill" />
    </button>
  );
}

export default SettingsButton;
