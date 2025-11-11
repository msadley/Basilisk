import type { Chat } from "@basilisk/core";
import styles from "./Avatar.module.css";
import { observer } from "mobx-react-lite";
import { memo } from "react";
import { Icon } from "@iconify/react";

type AvatarProps = {
  onClick?: () => void;
  chat: Chat;
};

const Avatar = observer(({ onClick, chat }: AvatarProps) => {
  return (
    <div key={chat.id} className={styles.avatar} onClick={onClick}>
      {chat.avatar ? (
        <img src={chat.avatar} />
      ) : chat.name ? (
        chat.name[0]
      ) : (
        <Icon icon="mingcute:user-2-fill" />
      )}
    </div>
  );
});

export default memo(Avatar);
