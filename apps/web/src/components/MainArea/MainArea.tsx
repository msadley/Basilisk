import Welcome from "./views/Home/Home";
import Chat from "./views/Chat/Chat";
import Settings from "./views/Settings/Settings";
import AddChat from "./views/AddChat/AddChat";
import type { ViewProps } from "../../types";
import styles from "./MainArea.module.css";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLayout } from "../../contexts/LayoutContext";

// Isso precisa saber qual é a view

function MainArea() {
  const [header, setHeader] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();
  const [leftPanel, setLeftPanel] = useState<ReactNode>();
  const [rightPanel, setRightPanel] = useState<ReactNode>();
  const { onView } = useLayout();

  const viewControls: ViewProps = {
    setHeader,
    setFooter,
    setLeftPanel,
    setRightPanel,
  };

  const body = () => {
    switch (onView.type) {
      case "welcome":
        return <Welcome key="welcome" {...viewControls} />;

      case "chat":
        if (onView.id === undefined)
          throw new Error("ID do chat não foi fornecido.");

        return <Chat key={onView.id} id={onView.id} {...viewControls} />;

      case "addChat":
        return <AddChat key="addChat" {...viewControls} />;

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
      <AnimatePresence mode="popLayout">
        <motion.div
          key={onView.id}
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
          key={onView.id}
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
}

export default MainArea;
