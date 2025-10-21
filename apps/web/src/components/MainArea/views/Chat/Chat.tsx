import { useEffect, useState, type ReactNode } from "react";
import styles from "./Chat.module.css";
import type { Database } from "@basilisk/core";
import Message from "./Message/Message";
import InputBox from "./InputBox/InputBox";
import { motion } from "framer-motion";

type ChatProps = {
  id: string;
  setHeader: (element: ReactNode) => void;
  setFooter: (element: ReactNode) => void;
};

function Chat({ id, setHeader, setFooter }: ChatProps) {
  const [database, setDatabase] = useState<Database>({
    profile: { id: "" },
    messages: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  function renderMessages() {
    return database.messages.map((message) => (
      <Message
        key={message.id}
        content={message.content}
        timestamp={message.timestamp}
      />
    ));
  }

  useEffect(() => {
    async function getDatabase() {
      try {
        const response = await fetch(`http://localhost:3001/chat/${id}`);
        if (!response.ok) {
          throw new Error("Falha ao buscar dados");
        }
        const data: Database = await response.json();
        setDatabase(data);
      } catch (error: any) {
        setError(error.message || "Ocorreu um erro.");
      } finally {
        setIsLoading(false);
      }
    }

    getDatabase();
  }, [id]);

  useEffect(() => {
    if (database.profile.id) {
      setHeader(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {database.profile.name || database.profile.id}
        </motion.div>
      );
    }

    return () => setHeader(undefined);
  }, [database]);

  useEffect(() => {
    setFooter(<InputBox />);
  }, [setFooter]);

  // TODO Melhorar isso
  if (isLoading) {
    return <div></div>;
  }

  if (error) {
    return <div className={styles.chat}>Erro: {error}</div>;
  }

  if (!database) {
    return <div className={styles.chat}>Chat não encontrado</div>;
  }

  return <div className={styles.chat}>{renderMessages()}</div>;
}

export default Chat;
