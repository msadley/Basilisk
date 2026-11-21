import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLayoutStore } from "../../stores/LayoutStore";
import Toast from "../Toast/Toast";
import styles from "./MainArea.module.css";
import AddChat from "./views/AddChat/AddChat";
import Chat from "./views/Chat/Chat";
import ChatHeader from "./views/Chat/ChatHeader/ChatHeader";
import InputBox from "./views/Chat/InputBox/InputBox";
import Home from "./views/Home/Home";

const headerVariants = {
  hidden: {
    y: -10,
    opacity: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      layout: {
        duration: 1,
      },
      opacity: {
        duration: 0.5,
      },
    },
  },
};

const MainArea = () => {
  const view = useLayoutStore((state) => state.mainView);

  const viewKey =
    view.type === "chat" ? `chat-${view.details.chatId}` : view.type;

  let header: ReactNode = null;
  let body: ReactNode = null;
  let footer: ReactNode = null;

  switch (view.type) {
    case "home":
      body = <Home key="home" />;
      break;
    case "chat":
      header = <ChatHeader chatId={view.details.chatId} />;
      body = <Chat key={view.details.chatId} chatId={view.details.chatId} />;
      footer = <InputBox chatId={view.details.chatId} />;
      break;
    case "addChat":
      body = <AddChat key="add-chat" />;
      break;
  }

  return (
    <div className={styles.mainArea}>
      <div className={styles.headerContainer}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={viewKey}
            layout
            className={styles.header}
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {header}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        layout
        className={styles.body}
        transition={{
          layout: { duration: 0.5 },
        }}
      >
        <Toast />
        <AnimatePresence mode="wait">{body}</AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewKey}
          layout
          className={styles.footer}
          transition={{
            layout: { duration: 0.5 },
          }}
        >
          {footer}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MainArea;
