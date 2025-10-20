import { useEffect, useState } from "react";

import styles from "./Sidebar.module.css";
import SettingsButton from "./SettingsButton/SettingsButton";
import type { Contact, View } from "../../types";
import AddChatButton from "./AddChatButton/AddChatButton";
import WelcomeButton from "./WelcomeButton/WelcomeButton";

type SidebarProps = {
  onViewChange: (view: View) => void;
};

function Sidebar({ onViewChange }: SidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function renderContacts() {
    return contacts.map((contact) => (
      <div
        key={contact.id}
        className={styles.contact}
        onClick={() => onViewChange({ type: "chat", id: contact.id })}
      >
        <img src={contact.profilePicture} />
      </div>
    ));
  }

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch("http://localhost:3001/chat");
        if (!response.ok) {
          throw new Error("Falha ao buscar dados");
        }
        const data = await response.json();
        setContacts(data);
      } catch (error: any) {
        setError(error.message || "Ocorreu um erro.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContacts();
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
        <WelcomeButton onClick={() => onViewChange({ type: "welcome" })} />
      </div>
      <div className={styles.body}>
        <div className={styles.contacts}>{renderContacts()}</div>
      </div>
      <div className={styles.footer}>
        <AddChatButton onClick={() => onViewChange({ type: "add-chat" })} />
        <SettingsButton onClick={() => onViewChange({ type: "settings" })} />
      </div>
    </div>
  );
}

export default Sidebar;
