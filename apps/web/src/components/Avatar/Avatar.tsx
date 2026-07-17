import type { Chat } from "@basilisk/core";
import styles from "./Avatar.module.css";
import { memo } from "react";
import { Icon } from "@iconify/react";
import { useConnectionStore } from "../../stores/ConnectionStore";

type AvatarProps = {
  indicator?: boolean;
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

const Avatar = ({ onClick, chat, indicator }: AvatarProps) => {
  const connectionStatus = useConnectionStore(
    (state) => state.connectionStatuses[chat.id],
  );
  const chatAsAny = chat as any;

  return (
    <div
      key={chat.id}
      className={styles.avatar}
      onClick={onClick}
      style={{
        backgroundColor: bgColors[Math.floor(Math.random() * bgColors.length)],
      }}
    >
      {chatAsAny.avatar ? (
        <img src={chatAsAny.avatar} />
      ) : chatAsAny.name ? (
        chatAsAny.name[0]
      ) : (
        <Icon icon="mingcute:user-2-fill" />
      )}
      {indicator && (
        <div
          className={styles.indicator}
          style={{
            backgroundColor: !(connectionStatus === undefined)
              ? connectionStatus === true
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
