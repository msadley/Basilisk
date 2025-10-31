import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import type { ViewProps } from "../../../../types";
import InputBox from "./InputBox/InputBox";
import Message from "./Message/Message";
import styles from "./Chat.module.css";
import { profileStore } from "../../../../stores/ProfileStore";
import { messageStore } from "../../../../stores/MessageStore";
import { userStore } from "../../../../stores/UserStore";

interface ChatProps extends ViewProps {
  id: string;
}

function Chat({
  id,
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
}: ChatProps) {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getMessages = messageStore.loadMore;

  const sendTextMessage = async (message: string) => {
    await messageStore.sendMessage(id, message);
  };

  // Verificar race conditions aqui
  const isProfileLoading = userStore.isProfileLoading;
  const profile = userStore.userProfile;

  const peerProfile = profileStore.profiles.get(id);
  const messages = messageStore.messages.get(id) || [];

  useEffect(() => {
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, []);

  useEffect(() => {
    if (!peerProfile) profileStore.getProfile(id);
  }, [id, peerProfile, profileStore]);

  useEffect(() => {
    const getProfile = async () => {
      let peerProfile = profileStore.profiles.get(id);
      if (!peerProfile) await profileStore.getProfile(id);
    };
    getProfile();
    setHeader(<>{peerProfile?.name ?? id}</>);
  }, [id, setHeader]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number | null>(null);
  const prevMessageCountRef = useRef(0);

  const loadMoreMessages = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    if (containerRef.current) {
      scrollRef.current = containerRef.current.scrollHeight;
    }
    prevMessageCountRef.current = messages.length;
    getMessages(id, page);
  }, [id, page, getMessages, isLoading, hasMore, messages.length]);

  useEffect(() => {
    if (isLoading || isInitialLoad) {
      const newMessagesCount = messages.length - prevMessageCountRef.current;
      if (newMessagesCount < 20) {
        setHasMore(false);
      }
      setPage((prevPage) => prevPage + 1);
      if (isLoading) setIsLoading(false);
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [messages, isLoading, isInitialLoad]);

  useEffect(() => {
    setHasMore(true);
    setPage(1);
    setIsInitialLoad(true);
    setIsLoading(false);
    prevMessageCountRef.current = 0;

    getMessages(id, 1);
  }, [id, getMessages]);

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

    if (scrollRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - scrollRef.current;
      scrollRef.current = null;
    } else {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setFooter(<InputBox sendMessage={sendTextMessage} />);

    return () => {
      setFooter(undefined);
    };
  }, [setFooter]);

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

      <div ref={sentinelRef} style={{ height: "1px" }}>
        {hasMore && isLoading && (
          <div className={styles.loadingContainer}>
            <Icon
              className={styles.loadingIcon}
              icon="mingcute:loading-3-fill"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
