import { useEffect, useState } from "react";
import type { MainView, ViewProps } from "../../../../types";
import styles from "./AddChat.module.css";
import { Icon } from "@iconify/react";
import ButtonArray from "./ButtonArray/ButtonArray";
import PrivateForm from "./PrivateForm/PrivateForm";
import { chatStore } from "../../../../stores/ChatStore";
import type { Chat } from "@basilisk/core";

export interface AddChatViewProps extends ViewProps {
  setView: (view: MainView) => void;
}

export type FormProps = {
  createChat: (chat: Chat) => Promise<Chat | undefined>;
  setIsLoading: (value: boolean) => void;
  setView: (view: MainView) => void;
};

function AddChat({ setHeader, setFooter, setView }: AddChatViewProps) {
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
  }, []);

  return !isLoading ? (
    <div className={styles.addChat}>
      <div className={styles.container}>
        <ButtonArray
          activeButtonIndex={activeButton}
          setActiveButtonIndex={setActiveButton}
        />
        <div className={styles.formContainer}>
          <div className={styles.form}>
            {!activeButton ? (
              <PrivateForm {...formProps} />
            ) : (
              <p>Menu de grupos em construção!</p>
            )}
          </div>
        </div>
      </div>
    </div>
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
