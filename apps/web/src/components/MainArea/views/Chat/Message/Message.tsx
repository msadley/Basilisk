import { observer } from "mobx-react-lite";
import styles from "./Message.module.css";
import type { Chat, Message as MessageType } from "@basilisk/core";
import { motion } from "framer-motion";
import { userStore } from "../../../../../stores/UserStore";
import { memo } from "react";
import Avatar from "../../../../Avatar/Avatar";

type MessageProps = {
  message: MessageType;
  chat: Chat;
};

const Message = observer(({ message, chat }: MessageProps) => {
  const profile = userStore.userProfile;

  return (
    <motion.div
      className={styles.container}
      key={message.id}
      style={{
        alignItems: message.from === profile?.id ? "flex-end" : "flex-start",
        flexDirection: message.from === profile?.id ? "row-reverse" : "row",
      }}
      initial={{
        opacity: 0,
        x: (message.from === profile?.id ? 1 : -1) * 20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: (message.from === profile?.id ? 1 : -1) * 20,
      }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      {/* <div className={styles.avatarContainer}>
        <Avatar chat={chat} />
      </div> */}
      <div className={styles.message}>{message.content}</div>
    </motion.div>
  );
});

export default memo(Message);
