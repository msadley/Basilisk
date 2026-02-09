import { Icon } from "@iconify/react";
import styles from "./AddChatButton.module.css";
import type { ButtonProps } from "../../../../types";

function AddChatButton({ onClick }: ButtonProps) {
  return (
    <button className={styles.addChatButton} onClick={onClick}>
      <Icon icon="mingcute:add-circle-fill" />
    </button>
  );
}

export default AddChatButton;
