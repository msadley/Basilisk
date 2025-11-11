import Home from "./views/Home/Home";
import Chat from "./views/Chat/Chat";
import Settings from "./views/Settings/Settings";
import AddChat from "./views/AddChat/AddChat";
import type { ViewProps } from "../../types";
import styles from "./MainArea.module.css";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { layoutStore } from "../../stores/LayoutStore";
import { observer } from "mobx-react-lite";

const MainArea = observer(() => {
  const [header, setHeader] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();
  const [leftPanel, setLeftPanel] = useState<ReactNode>();
  const [rightPanel, setRightPanel] = useState<ReactNode>();
  const { view, setView } = layoutStore;

  const viewControls: ViewProps = {
    setHeader,
    setFooter,
    setLeftPanel,
    setRightPanel,
  };

  const body = () => {
    switch (view.type) {
      case "home":
        return <Home key="home" {...viewControls} />;

      case "chat":
        if (view.details.chatId === undefined)
          throw new Error("ID do chat não foi fornecido.");

        return (
          <Chat
            key={view.details.chatId}
            id={view.details.chatId}
            {...viewControls}
          />
        );

      case "add-chat":
        return <AddChat key="add-chat" {...viewControls} setView={setView} />;

      case "settings":
        return <Settings key="settings" {...viewControls} />;

      default:
        if (header) setHeader(null);
        if (footer) setFooter(null);
        if (leftPanel) setLeftPanel(null);
        if (rightPanel) setRightPanel(null);
        return null;
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
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{
              layout: { duration: 0.5 },
              opacity: { duration: 0.3 },
            }}
          >
            {header}
          </motion.div>
        </AnimatePresence>
        <Indicator />
      </div>
      <motion.div
        layout
        className={styles.body}
        transition={{
          layout: { duration: 0.5 },
        }}
      >
        <AnimatePresence mode="wait">{body()}</AnimatePresence>
      </motion.div>

      <AnimatePresence mode="popLayout">
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
