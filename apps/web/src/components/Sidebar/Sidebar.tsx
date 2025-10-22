import { useEffect, useState } from "react";

import styles from "./Sidebar.module.css";
import type { View } from "../../App";
import SettingsButton from "./buttons/SettingsButton/SettingsButton";
import AddChatButton from "./buttons/AddChatButton/AddChatButton";
import HomeButton from "./buttons/HomeButton/HomeButton";
import { Icon } from "@iconify/react";
import type { Chat } from "../../types";

type SidebarProps = {
  onViewChange: (view: View) => void;
};

function Sidebar({ onViewChange }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await fetch("http://localhost:3001/chat");
        if (!response.ok) {
          throw new Error(
            `Falha ao buscar dados: ${response.status} ${response.statusText}`
          );
        }
        const data: Chat[] = await response.json();
        setChats(data);
      } catch (error: any) {
        setError(error.message || "Ocorreu um erro.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchChats();
  }, []);

  // TODO Melhorar isso
  if (isLoading) {
    return <div className={styles.sidebar}>Carregando contatos...</div>;
  }

  if (error) {
    return <div className={styles.sidebar}>Erro: {error}</div>;
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
