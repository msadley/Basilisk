import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { ViewProps } from "../../../../types";
import InputBox from "./InputBox/InputBox";
import styles from "./Chat.module.css";
import { profileStore } from "../../../../stores/ProfileStore";
import { messageStore } from "../../../../stores/MessageStore";
import { observer } from "mobx-react-lite";
import Message from "./Message/Message";
import type { Chat as ChatType, Profile } from "@basilisk/core";
import { Virtuoso } from "react-virtuoso";
import { layoutStore } from "../../../../stores/LayoutStore";
import Header from "./Header/Header";

interface ChatProps extends ViewProps {
  chat: ChatType;
}

const Chat = observer(({ chat, setHeader, setFooter }: ChatProps) => {
  const { addToast } = layoutStore;

  const [peerProfile, setPeerProfile] = useState<Profile>();
  const [peerProfileError] = useState<Error>();

  const messages = messageStore.getChatMessages(chat.id);

  const loadMore = useCallback(async () => {
    await messageStore.loadMore(chat.id);
    console.log("loading more messages");
  }, [chat.id]);

  const sendTextMessage = useCallback(
    async (content: string) => {
      await messageStore.sendMessage(chat.id, content);
    },
    [chat.id],
  );

  useEffect(() => {
    if (chat.type === "group") return;

    const getPeerProfile = async (peerId: string) => {
      try {
        const profile = await profileStore.getProfile(peerId);
        setPeerProfile(profile);
      } catch (e: any) {
        addToast("Usuário offline", "error");
      }
    };

    getPeerProfile(chat.id);
  }, [chat.id]);

  useEffect(() => {
    const headerText = peerProfileError
      ? peerProfileError.message
      : (peerProfile?.name ?? chat.id);
    setHeader(<>{headerText}</>);
  }, [chat.id, setHeader, peerProfile, peerProfileError]);

  useEffect(() => {
    loadMore();
  }, [chat.id]);

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
});

export default Chat;
