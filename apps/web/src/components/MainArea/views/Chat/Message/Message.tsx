import { observer } from "mobx-react-lite";
import styles from "./Message.module.css";
import type { Chat } from "@basilisk/core";
import type { Message } from "../../../../../stores/MessageStore";
import { AnimatePresence, motion } from "framer-motion";
import { userStore } from "../../../../../stores/UserStore";
import { memo } from "react";
import { Icon } from "@iconify/react";
// import Avatar from "../../../../Avatar/Avatar";

type MessageProps = {
  message: Message;
  chat: Chat;
};

const Message = observer(({ message /*chat*/ }: MessageProps) => {
  const profile = userStore.userProfile;

  const messageClasses = `
    ${styles.message}
    ${message.status === "error" ? styles.error : ""}
  `;

  return (
    <motion.div
      className={styles.container}
      key={message.uuid}
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

      <AnimatePresence mode="popLayout" key={message.uuid}>
        {message.status === "ok" ? undefined : (
          <motion.div
            className={styles.statusContainer}
            key={message.uuid}
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: 20,
            }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Icon
              icon={
                message.status === "sending"
                  ? "mingcute:loading-3-fill"
                  : "mingcute:warning-fill"
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={messageClasses}>{message.content}</div>
    </motion.div>
  );
});

export default memo(Message);
