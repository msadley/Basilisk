import { Icon } from "@iconify/react";

import styles from "./SettingsButton.module.css";

interface SettingsButtonProps {
  onClick: () => void;
}

function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button className={styles.settingsButton} onClick={onClick}>
      <Icon icon="mingcute:settings-1-fill" />
    </button>
  );
}

export default SettingsButton;
