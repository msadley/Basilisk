import Home from "./views/Home/Home";
import Chat from "./views/Chat/Chat";
import AddChat from "./views/AddChat/AddChat";
import type { ViewProps } from "../../types";
import styles from "./MainArea.module.css";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { layoutStore } from "../../stores/LayoutStore";
import { observer } from "mobx-react-lite";
import Toast from "../Toast/Toast";

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

const MainArea = observer(() => {
  const [header, setHeader] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();
  const { mainView: view, setMainView: setView } = layoutStore;

  const viewControls: ViewProps = {
    setHeader,
    setFooter,
  };

  const body = () => {
    switch (view.type) {
      case "home":
        return <Home key="home" {...viewControls} />;

      case "chat":
        return (
          <Chat
            key={view.details.chat.id}
            chat={view.details.chat}
            {...viewControls}
          />
        );

      case "addChat":
        return <AddChat key="add-chat" {...viewControls} setView={setView} />;

      default:
        if (header) setHeader(null);
        if (footer) setFooter(null);
    }
  };

  return (
    <div className={styles.mainArea}>
      <div className={styles.headerContainer}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={view.type}
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
        <AnimatePresence mode="wait">{body()}</AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view.type}
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
});

export default MainArea;
