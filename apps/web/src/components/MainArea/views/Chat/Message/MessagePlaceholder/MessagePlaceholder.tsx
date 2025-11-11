import styles from "./MessagePlaceholder.module.css";
import { motion } from "framer-motion";
import { memo } from "react";
import type { MessagePlaceholder } from "../../../../../../stores/MessageStore";
import { observer } from "mobx-react-lite";
import { Icon } from "@iconify/react";

type MessagePlaceholderProps = {
  messagePlaceholder: MessagePlaceholder;
};

const Message = observer(({ messagePlaceholder }: MessagePlaceholderProps) => {
  return (
    <motion.div
      className={styles.container}
      key={messagePlaceholder.id}
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
      {!messagePlaceholder.error ? (
        <Icon icon="mingcute:loading-3-fill" />
      ) : undefined}
      <div
        className={styles.message}
        style={{
          backgroundColor: messagePlaceholder.error
            ? "var(--ctp-error)"
            : undefined,
        }}
      >
        {messagePlaceholder.content}
      </div>
    </motion.div>
  );
});

export default memo(Message);
