import type { Chat } from "@basilisk/core";
import styles from "./Avatar.module.css";
import { observer } from "mobx-react-lite";
import { memo } from "react";
import { Icon } from "@iconify/react";
import { connectionStore } from "../../stores/ConnectionStore";

type AvatarProps = {
  indicator?: boolean;
  onClick?: () => void;
  chat: Chat;
};

const bgColors = [
  "var(--ctp-rosewater)",
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

const Avatar = observer(({ onClick, chat, indicator }: AvatarProps) => {
  const connectionStatus = connectionStore.connectionStatuses.get(chat.id);

  return (
    <div
      key={chat.id}
      className={styles.avatar}
      onClick={onClick}
      style={{
        backgroundColor: bgColors[Math.floor(Math.random() * bgColors.length)],
      }}
    >
      {chat.avatar ? (
        <img src={chat.avatar} />
      ) : chat.name ? (
        chat.name[0]
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
});

export default memo(Avatar);
