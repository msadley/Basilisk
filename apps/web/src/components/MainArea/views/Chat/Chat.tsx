import { useCallback, useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { ViewProps } from "../../../../types";
import InputBox from "./InputBox/InputBox";
import styles from "./Chat.module.css";
import { useProfileStore } from "../../../../stores/ProfileStore";
import { useMessageStore } from "../../../../stores/MessageStore";
import Message from "./Message/Message";
import type { Chat as ChatType, Profile } from "@basilisk/core";
import { Virtuoso } from "react-virtuoso";
import { useLayoutStore } from "../../../../stores/LayoutStore";
import Header from "./Header/Header";

interface ChatProps extends ViewProps {
  chat: ChatType;
}

const Chat = ({ chat, setHeader, setFooter }: ChatProps) => {
  const addToast = useLayoutStore((state) => state.addToast);
  const getProfile = useProfileStore((state) => state.getProfile);
  const loadMoreAction = useMessageStore((state) => state.loadMore);
  const sendMessageAction = useMessageStore((state) => state.sendMessage);

  const chatState = useMessageStore(
    useCallback((state) => state.chats[chat.id], [chat.id])
  );

  const messages = useMemo(() => {
    if (!chatState) return [];
    return chatState.ids.map((id) => chatState.messages[id]);
  }, [chatState]);

  const [peerProfile, setPeerProfile] = useState<Profile>();
  const [peerProfileError] = useState<Error>();

  const loadMore = useCallback(async () => {
    await loadMoreAction(chat.id);
    console.log("loading more messages");
  }, [chat.id, loadMoreAction]);

  const sendTextMessage = useCallback(
    async (content: string) => {
      await sendMessageAction(chat.id, content);
    },
    [chat.id, sendMessageAction],
  );
  useEffect(() => {
    if ("name" in chat) return;

    const getPeerProfile = async (peerId: string) => {
      try {
        const profile = await getProfile(peerId);
        setPeerProfile(profile);
      } catch (e: any) {
        addToast("Usuário offline", "error");
      }
    };

    getPeerProfile(chat.id);
  }, [chat.id, getProfile, addToast, chat]);

  useEffect(() => {
    const headerText = peerProfileError
      ? peerProfileError.message
      : (peerProfile?.name ?? chat.id);
    setHeader(<>{headerText}</>);
  }, [chat.id, setHeader, peerProfile, peerProfileError]);

  useEffect(() => {
    loadMore();
  }, [chat.id, loadMore]);

  useEffect(() => {
    setFooter(<InputBox sendMessage={sendTextMessage} />);
    return () => setFooter(undefined);
  }, [setFooter, sendTextMessage]);

  return (
    <div className={styles.chat}>
      <AnimatePresence propagate mode="wait">
        <Virtuoso
          className={styles.virtuoso}
          startReached={loadMore}
          components={{ Header }}
          alignToBottom
          followOutput
          seamless
          increaseViewportBy={200}
          data={messages}
          itemContent={(_, msg) => (
            <AnimatePresence>
              {<Message key={msg.uuid} message={msg} chat={chat} />}
            </AnimatePresence>
          )}
        />
      </AnimatePresence>
    </div>
  );
};

export default Chat;
