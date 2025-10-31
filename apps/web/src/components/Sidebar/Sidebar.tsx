import styles from "./Sidebar.module.css";
import SettingsButton from "./buttons/SettingsButton/SettingsButton";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import { Icon } from "@iconify/react";
import type { Chat } from "@basilisk/core";
import { layoutStore } from "../../stores/LayoutStore";
import { chatStore } from "../../stores/ChatStore";
import { observer } from "mobx-react-lite";

const Sidebar = observer(() => {
  const chats = chatStore.chats;
  const setView = layoutStore.setView;

  function renderChats() {
    return chats.map((chat: Chat) => (
      <div
        key={chat.id}
        className={styles.chat}
        onClick={() => setView({ type: "chat", details: { chatId: chat.id } })}
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
        <HomeButton onClick={() => setView({ type: "home" })} />
      </div>
      <div className={styles.body}>
        <div className={styles.chatContainer}>{renderChats()}</div>
      </div>
      <div className={styles.footer}>
        <AddChatButton onClick={() => setView({ type: "add-chat" })} />
        <SettingsButton onClick={() => setView({ type: "settings" })} />
      </div>
    </div>
  );
});

export default Sidebar;
