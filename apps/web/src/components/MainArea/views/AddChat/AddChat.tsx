import { useEffect, useState } from "react";
import type { View, ViewProps } from "../../../../types";
import styles from "./AddChat.module.css";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import ButtonArray from "./ButtonArray/ButtonArray";
import PrivateForm from "./PrivateForm/PrivateForm";
import { chatStore } from "../../../../stores/ChatStore";
import type { Chat } from "@basilisk/core";

export interface AddChatViewProps extends ViewProps {
  setView: (view: View) => void;
}

export type FormProps = {
  createChat: (chat: Chat) => Promise<Chat | undefined>;
  setIsLoading: (value: boolean) => void;
  setView: (view: View) => void;
};

function AddChat({
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
  setView,
}: AddChatViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createChat = chatStore.createChat;

  // 0 para privado e 1 para grupo
  const [activeButton, setActiveButton] = useState<number>(0);

  const formProps: FormProps = {
    createChat,
    setIsLoading,
    setView,
  };

  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, []);

  return !isLoading ? (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={styles.addChat}
    >
      <motion.div className={styles.container}>
        <ButtonArray
          activeButtonIndex={activeButton}
          setActiveButtonIndex={setActiveButton}
        />
        <motion.div layout className={styles.formContainer}>
          <motion.div layout className={styles.form}>
            {!activeButton ? (
              <PrivateForm {...formProps} />
            ) : (
              <p>Menu de grupos em construção!</p>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  ) : (
    <div className={styles.loadingContainer}>
      <Icon
        className={styles.loadingIcon}
        icon="mingcute:loading-3-fill"
      ></Icon>
      <p>Criando chat...</p>
    </div>
  );
}

export default AddChat;
