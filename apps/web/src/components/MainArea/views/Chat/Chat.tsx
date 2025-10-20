import { useEffect, useState } from "react";
import styles from "./Chat.module.css";
import type { Database } from "../../../../types";
import Message from "./Message/Message";

type ChatProps = {
  id: string;
};

function Chat({ id }: ChatProps) {
  const [database, setDatabase] = useState<Database>({ id: "", messages: [] });
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
        const data = await response.json();
        setDatabase(data);
      } catch (error: any) {
        setError(error.message || "Ocorreu um erro.");
      } finally {
        setIsLoading(false);
      }
    }

    getDatabase();
  }, [id]);

  // TODO Melhorar isso
  if (isLoading) {
    return <div className={styles.chat}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles.chat}>Erro: {error}</div>;
  }

  if (!database) {
    return <div className={styles.chat}>Chat não encontrado</div>;
  }

  return (
    <div className={styles.chat}>
      <div className={styles.header}></div>
      <div className={styles.body}>
        <div className={styles.sidebar}></div>
        <div />
        <div />
      </div>
      <div className={styles.footer}>
        <div className={styles.textBox}>
          <input type="text" placeholder="Digite uma mensagem..." />
          <button>Enviar</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
