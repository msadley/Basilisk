import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import type { UiMessage } from "../../../../../stores/MessageStore";
import styles from "./Message.module.css";

type MessageProps = {
  message: UiMessage;
  isOwn: boolean;
  onResend: (message: UiMessage) => void;
};

const renderContent = (message: UiMessage) => {
  switch (message.contentType) {
    case "text":
      return message.content;
    case "image":
      return "[Imagem]";
    case "file":
      return "[Arquivo]";
  }
};

const Message = ({ message, isOwn, onResend }: MessageProps) => {
  const status = message.status ?? "ok";
  const messageClasses = `${styles.message} ${status === "error" ? styles.error : ""}`;

  return (
    <div
      className={styles.container}
      style={{
        alignItems: isOwn ? "flex-end" : "flex-start",
        flexDirection: isOwn ? "row-reverse" : "row",
      }}
    >
      <AnimatePresence mode="popLayout">
        {status !== "ok" && (
          <motion.div
            className={styles.statusContainer}
            key="status"
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
                status === "sending"
                  ? "mingcute:loading-3-fill"
                  : "cuida:rotate-left-outline"
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={status === "error" ? () => onResend(message) : undefined}
        className={messageClasses}
      >
        {renderContent(message)}
      </button>
    </div>
  );
};

export default memo(Message);
