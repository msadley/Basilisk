import { useCallback } from "react";
import { useChats } from "../../stores/ChatStore";
import { useLayoutStore } from "../../stores/LayoutStore";
import Avatar from "../Avatar/Avatar";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import ThemeSelector from "./buttons/ThemeSelector/ThemeSelector";
import styles from "./Sidebar.module.css";

const Sidebar = () => {
  const { data: chats } = useChats();

  const handleSelectChat = useCallback((chatId: string) => {
    useLayoutStore.getState().setMainView({
      type: "chat",
      details: { chatId },
    });
  }, []);

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <HomeButton
          onClick={() =>
            useLayoutStore.getState().setMainView({ type: "home" })
          }
        />
      </div>
      <div className={styles.body}>
        <div className={styles.chatContainer}>
          {chats
            ? chats.map((chat) => (
                <Avatar
                  key={chat.id}
                  onSelect={handleSelectChat}
                  chat={chat}
                />
              ))
            : null}
        </div>
      </div>
      <div className={styles.footer}>
        <ThemeSelector />
        <AddChatButton
          onClick={() =>
            useLayoutStore.getState().setMainView({ type: "addChat" })
          }
        />
      </div>
    </div>
  );
};

export default Sidebar;
