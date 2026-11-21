import { groupChatSchema } from "@basilisk/core/models";
import { useChat } from "../../../../../stores/ChatStore";
import { useProfile } from "../../../../../stores/ProfileStore";

type ChatHeaderProps = {
  chatId: string;
};

const ChatHeader = ({ chatId }: ChatHeaderProps) => {
  const { data: chat } = useChat(chatId);
  const isGroup = chat ? groupChatSchema.allows(chat) : false;
  const { data: peerProfile } = useProfile(chat && !isGroup ? chat.id : undefined);

  if (!chat) {
    return <>Carregando...</>;
  }

  if (groupChatSchema.allows(chat)) {
    return <>{chat.name}</>;
  }

  return <>{peerProfile?.name?.trim() || chat.id}</>;
};

export default ChatHeader;
