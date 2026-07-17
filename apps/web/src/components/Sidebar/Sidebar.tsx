import styles from "./Sidebar.module.css";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import ThemeSelector from "./buttons/ThemeSelector/ThemeSelector";
import type { Chat } from "@basilisk/core";
import { useLayoutStore } from "../../stores/LayoutStore";
import { useChatStore } from "../../stores/ChatStore";
import Avatar from "../Avatar/Avatar";
import { useConnectionStore } from "../../stores/ConnectionStore";
import { useEffect } from "react";

const Sidebar = () => {
  const chats = useChatStore((state) => state.chats);
  const setMainView = useLayoutStore((state) => state.setMainView);
  const connectionStatuses = useConnectionStore((state) => state.connectionStatuses);
  const addConnectionListener = useConnectionStore((state) => state.addConnectionListener);

  useEffect(() => {
    chats.forEach((chat: Chat) => {
      if (!("name" in chat)) {
        if (!(chat.id in connectionStatuses)) {
          addConnectionListener(chat.id);
        }
      }
    });
  }, [chats, connectionStatuses, addConnectionListener]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <HomeButton onClick={() => setMainView({ type: "home" })} />
      </div>
      <div className={styles.body}>
        <div className={styles.chatContainer}>
          {chats.map((chat: Chat) => (
            <Avatar
              key={chat.id}
              onClick={() => setMainView({ type: "chat", details: { chat } })}
              chat={chat}
              indicator={!("name" in chat)}
            />
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <ThemeSelector />
        <AddChatButton onClick={() => setMainView({ type: "addChat" })} />
      </div>
    </div>
  );
};

export default Sidebar;
