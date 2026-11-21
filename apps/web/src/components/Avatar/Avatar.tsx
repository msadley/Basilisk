import { type Chat, groupChatSchema } from "@basilisk/core";
import { Icon } from "@iconify/react";
import { memo, useEffect, useState } from "react";
import { useConnectionStore } from "../../stores/ConnectionStore";
import { useProfile } from "../../stores/ProfileStore";
import styles from "./Avatar.module.css";

type AvatarProps = {
  indicator?: boolean;
  onSelect?: (chatId: string) => void;
  onClick?: () => void;
  chat: Chat;
};

const bgColors = [
  "var(--ctp-flamingo)",
  "var(--ctp-pink)",
  "var(--ctp-mauve)",
  "var(--ctp-red)",
  "var(--ctp-maroon)",
  "var(--ctp-peach)",
  "var(--ctp-yellow)",
  "var(--ctp-green)",
  "var(--ctp-teal)",
  "var(--ctp-sky)",
  "var(--ctp-sapphire)",
  "var(--ctp-blue)",
  "var(--ctp-lavender)",
];

const getBgColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return bgColors[hash % bgColors.length];
};

const useObjectUrl = (bytes: Uint8Array | null | undefined): string | undefined => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!bytes) {
      setUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)]));
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [bytes]);

  return url;
};

const Avatar = ({ onSelect, onClick, chat, indicator }: AvatarProps) => {
  const isGroup = groupChatSchema.allows(chat);
  const showIndicator = indicator ?? !isGroup;

  const isConnected = useConnectionStore((state) =>
    showIndicator ? state.peers[chat.id] : undefined,
  );
  const { data: peerProfile } = useProfile(isGroup ? undefined : chat.id);

  const displayName = isGroup ? chat.name : peerProfile?.name;
  const imageBytes = isGroup ? chat.image : peerProfile?.avatar;
  const avatarUrl = useObjectUrl(imageBytes);

  const handleClick = onSelect ? () => onSelect(chat.id) : onClick;

  return (
    <div
      className={styles.avatar}
      onClick={handleClick}
      style={{ backgroundColor: getBgColor(chat.id) }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName ?? "Avatar"} />
      ) : displayName ? (
        displayName[0]
      ) : (
        <Icon icon="mingcute:user-2-fill" />
      )}
      {showIndicator && (
        <div
          className={styles.indicator}
          style={{
            backgroundColor:
              isConnected !== undefined
                ? isConnected
                  ? "var(--ctp-green)"
                  : "var(--ctp-red)"
                : undefined,
          }}
        />
      )}
    </div>
  );
};

export default memo(Avatar);
