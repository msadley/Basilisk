import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence } from "framer-motion";
import type { ViewProps } from "../../../../types";
import InputBox from "./InputBox/InputBox";
import styles from "./Chat.module.css";
import { profileStore } from "../../../../stores/ProfileStore";
import { messageStore } from "../../../../stores/MessageStore";
import { observer } from "mobx-react-lite";
import Message from "./Message/Message";
import type { Chat as ChatType, Profile } from "@basilisk/core";

interface ChatProps extends ViewProps {
  chat: ChatType;
}

const Chat = observer(({ chat, setHeader, setFooter }: ChatProps) => {
  const [peerProfile, setPeerProfile] = useState<Profile>();
  const [peerProfileError, setPeerProfileError] = useState<Error>();

  const messages = messageStore.getChatMessages(chat.id);
  const chatState = messageStore.getChatState(chat.id);

  // Only one scroll container
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number | null>(null);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const { scrollHeight, scrollTop } = scrollEl;
    const oldScrollHeight = prevScrollHeight.current;

    if (oldScrollHeight !== null) {
      const delta = scrollHeight - oldScrollHeight;

      if (delta > 0) scrollEl.scrollTop = scrollTop + delta;
    }

    prevScrollHeight.current = scrollHeight;
  }, [messages]);

  const loadMore = useCallback(async () => {
    if (!chatState.hasMore || chatState.isLoading) return;

    await messageStore.loadMore(chat.id);
  }, [chat.id, chatState.hasMore, chatState.isLoading]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinel = loaderRef.current;
    if (!scrollEl || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        root: scrollEl,
        rootMargin: "400px 0px 0px 0px",
        threshold: 1.0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  const sendTextMessage = useCallback(
    async (content: string) => {
      await messageStore.sendMessage(chat.id, content);
    },
    [chat.id]
  );

  useEffect(() => {
    if (chat.type === "group") return;

    const getPeerProfile = async (peerId: string) => {
      try {
        const profile = await profileStore.getProfile(peerId);
        setPeerProfile(profile);
      } catch (e: any) {
        setPeerProfileError(e);
      }
    };

    getPeerProfile(chat.id);
  }, [chat.id]);

  useEffect(() => {
    const headerText = peerProfileError
      ? peerProfileError.message
      : peerProfile?.name ?? chat.id;
    setHeader(<>{headerText}</>);
  }, [chat.id, setHeader, peerProfile, peerProfileError]);

  useEffect(() => {
    setFooter(<InputBox sendMessage={sendTextMessage} />);
    return () => setFooter(undefined);
  }, [setFooter, sendTextMessage]);

  // === RENDER ===
  return (
    <div className={styles.chat} ref={scrollRef}>
      <div ref={loaderRef} className={styles.sentinel}>
        {chatState.isLoading && (
          <div className={styles.loadingContainer}>
            <Icon
              className={styles.loadingIcon}
              icon="mingcute:loading-3-fill"
            />
          </div>
        )}
      </div>
      <AnimatePresence>
        {messages.map((msg) => (
          <Message key={msg.uuid} message={msg} chat={chat} />
        ))}
      </AnimatePresence>
    </div>
  );
});

export default Chat;
