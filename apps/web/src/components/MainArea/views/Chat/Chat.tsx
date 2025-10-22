import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./Chat.module.css";
import InputBox from "./InputBox/InputBox";
import type { ViewProps, Message as MessageType } from "../../../../types";
import { Icon } from "@iconify/react";
import Message from "./Message/Message";
import { useUser } from "../../../../contexts/UserContext";
import { AnimatePresence, motion } from "framer-motion";

interface ChatProps extends ViewProps {
  id: string;
}

function Chat({ id, setHeader, setFooter }: ChatProps) {
  const { profile, isProfileLoading } = useUser();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number | null>(null);

  const fetchMessages = useCallback(
    (page: number): Promise<MessageType[]> => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const response = await fetch(
            `http://localhost:3001/chat/${id}/message?page=${page}`
          );
          const newMessages: MessageType[] = await response.json();
          resolve(newMessages);
        }, 500);
      });
    },
    [id]
  );

  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    if (containerRef.current) {
      scrollRef.current = containerRef.current.scrollHeight;
    }

    const newMessages = await fetchMessages(page);

    if (newMessages.length < 20) {
      setHasMore(false);
    } else {
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      setPage((prevPage) => prevPage + 1);
    }

    setIsLoading(false);
  }, [isLoading, hasMore, page, fetchMessages]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:3001/profile/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const profile = await response.json();

        if (profile.id) {
          setHeader(<div>{profile.name || profile.id}</div>);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load profile.");
      }
    };

    fetchProfile();

    return () => setHeader(undefined);
  }, [id, setHeader]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreMessages();
        }
      },
      {
        root: containerRef.current,
        threshold: 0,
        rootMargin: "120% 0px 0px 0px",
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadMoreMessages, hasMore, isLoading]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    if (isInitialLoad) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      if (messages.length > 0) {
        setIsInitialLoad(false);
      }
    } else if (scrollRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - scrollRef.current;
      containerRef.current.scrollTop += heightDifference;
      scrollRef.current = null;
    }
  }, [messages, isInitialLoad]);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    setPage(0);
    setHasMore(true);
    setIsInitialLoad(true);

    fetchMessages(0).then((initialMessages) => {
      setMessages(initialMessages);
      setPage(1);
      if (initialMessages.length < 20) {
        setHasMore(false);
      }
      setIsLoading(false);
    });
  }, [id, fetchMessages]);

  useEffect(() => {
    setFooter(<InputBox />);

    return () => {
      setFooter(undefined);
    };
  }, [setFooter]);

  if (error) {
    return <div className={styles.chat}>Erro: {error}</div>;
  }

  return (
    <div
      className={styles.chat}
      ref={containerRef}
      style={{
        overflowY: "auto",
        display: "flex",
        flexDirection: "column-reverse",
        height: "100%",
      }}
    >
      {messages.map((msg) =>
        !isProfileLoading ? (
          <AnimatePresence propagate>
            <motion.div
              key={msg.id}
              className={styles.messageContainer}
              style={{
                alignItems:
                  msg.from === profile?.id ? "flex-end" : "flex-start",
              }}
              initial={{
                opacity: 0,
                x: (msg.from === profile?.id ? 1 : -1) * 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: (msg.from === profile?.id ? 1 : -1) * 20,
              }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Message content={msg.content} timestamp={msg.timestamp} />
            </motion.div>
          </AnimatePresence>
        ) : null
      )}

      <div ref={sentinelRef}>
        {hasMore && isLoading && (
          <Icon
            className={styles.loadingIcon}
            icon="mingcute:loading-3-fill"
          ></Icon>
        )}
      </div>
    </div>
  );
}

export default Chat;
