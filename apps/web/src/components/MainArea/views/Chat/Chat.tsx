import { useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  INITIAL_FIRST_ITEM_INDEX,
  type UiMessage,
  useMessages,
  useSendMessage,
} from "../../../../stores/MessageStore";
import { useUserProfile } from "../../../../stores/ProfileStore";
import styles from "./Chat.module.css";
import Header from "./Header/Header";
import Message from "./Message/Message";

interface ChatProps {
  chatId: string;
}

const Chat = ({ chatId }: ChatProps) => {
  const { data: userProfile } = useUserProfile();
  const {
    data,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(chatId);
  const { mutate: sendMessage } = useSendMessage(chatId);

  const handleResend = useCallback(
    (msg: UiMessage) => {
      if (msg.contentType === "text") {
        sendMessage({ content: msg.content, retryClientId: msg.clientId });
      }
    },
    [sendMessage],
  );

  const messages = data?.messages ?? [];
  const firstItemIndex = data?.firstItemIndex ?? INITIAL_FIRST_ITEM_INDEX;

  if (isMessagesLoading) {
    return <div className={styles.chat} />;
  }

  return (
    <div className={styles.chat}>
      <Virtuoso
        className={styles.virtuoso}
        firstItemIndex={firstItemIndex}
        startReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        components={{ Header }}
        alignToBottom
        followOutput
        seamless
        increaseViewportBy={200}
        data={messages}
        computeItemKey={(_, msg) => msg.clientId ?? msg.id}
        itemContent={(_, msg) => (
          <Message
            message={msg}
            isOwn={msg.senderId === userProfile?.id}
            onResend={handleResend}
          />
        )}
      />
    </div>
  );
};

export default Chat;
