import { Icon } from "@iconify/react";

import styles from "./AddChatButton.module.css";

interface AddChatButtonProps {
  onClick: () => void;
}

function AddChatButton({ onClick }: AddChatButtonProps) {
  return (
    <button className={styles.addChatButton} onClick={onClick}>
      <Icon icon="mingcute:add-circle-fill" />
    </button>
  );
}

export default AddChatButton;
