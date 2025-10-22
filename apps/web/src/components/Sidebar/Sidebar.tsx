import styles from "./Sidebar.module.css";
import type { View } from "../../types";
import SettingsButton from "./buttons/SettingsButton/SettingsButton";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import { Icon } from "@iconify/react";
import type { Chat } from "../../types";
import { useData } from "../../contexts/DataContext";

type SidebarProps = {
  onViewChange: (view: View) => void;
};

function Sidebar({ onViewChange }: SidebarProps) {
  const { chats } = useData();

  function renderChats() {
    return chats.map((chat: Chat) => (
      <div
        key={chat.id}
        className={styles.chat}
        onClick={() => onViewChange({ type: "chat", id: chat.id })}
      >
        {chat.avatar ? (
          <img src={chat.avatar} alt="Profile" />
        ) : (
          <Icon icon="mingcute:user-2-fill" />
        )}
      </div>
    ));
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <HomeButton onClick={() => onViewChange({ type: "welcome" })} />
      </div>
      <div className={styles.body}>
        <div className={styles.chatContainer}>{renderChats()}</div>
      </div>
      <div className={styles.footer}>
        <AddChatButton onClick={() => onViewChange({ type: "add-chat" })} />
        <SettingsButton onClick={() => onViewChange({ type: "settings" })} />
      </div>
    </div>
  );
}

export default Sidebar;
