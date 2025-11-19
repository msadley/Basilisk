import styles from "./Sidebar.module.css";
import SettingsButton from "./buttons/SettingsButton/SettingsButton";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import type { Chat } from "@basilisk/core";
import { layoutStore } from "../../stores/LayoutStore";
import { chatStore } from "../../stores/ChatStore";
import { observer } from "mobx-react-lite";
import Avatar from "../Avatar/Avatar";
import { connectionStore } from "../../stores/ConnectionStore";

const Sidebar = observer(() => {
  const chats = chatStore.chats;
  const setMainView = layoutStore.setMainView;
  const setSidePanelView = layoutStore.setSidePanelView;

  const chatComponents = () => {
    chats.forEach((chat: Chat) => {
      if (chat.type === "private") {
        connectionStore.addConnectionListener(chat.id);
      }
    });
    return chats.map((chat: Chat) => (
      <Avatar
        key={chat.id}
        onClick={() => setMainView({ type: "chat", details: { chat } })}
        chat={chat}
        indicator={chat.type === "private"}
      />
    ));
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <HomeButton onClick={() => setMainView({ type: "home" })} />
      </div>
      <div className={styles.body}>
        <div className={styles.chatContainer}>{chatComponents()}</div>
      </div>
      <div className={styles.footer}>
        <AddChatButton onClick={() => setMainView({ type: "addChat" })} />
        <SettingsButton
          onClick={() => setSidePanelView({ type: "settings" })}
        />
      </div>
    </div>
  );
});

export default Sidebar;
