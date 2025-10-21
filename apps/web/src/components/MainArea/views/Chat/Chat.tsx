import { useEffect, useRef, useState } from "react";
import {useChatScroll, useDataLoader} from 'use-chat-scroll'
import styles from "./Chat.module.css";
import type { Database } from "@basilisk/core";
import Message from "./Message/Message";
import InputBox from "./InputBox/InputBox";
import type { ViewProps } from "../../../../types";

interface ChatProps extends ViewProps {
  id: string;
}

function Chat({ id, setHeader, setFooter }: ChatProps) {
  const [database, setDatabase] = useState<Database>({
    profile: { id: "" },
    messages: [],
  });
  const containerRef = useRef<React.RefObject<HTMLDivElement>>()
  const loader = useDataLoader(loadAdditionalData, data, setData)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);



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
      setHeader(<div>{database.profile.name || database.profile.id}</div>);
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

  return <div className={styles.chat}>{}</div>;
}

export default Chat;
