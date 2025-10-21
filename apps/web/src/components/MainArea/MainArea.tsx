import Welcome from "./views/Welcome/Welcome";
import Chat from "./views/Chat/Chat";
/* import GroupChat from "./views/GroupChat";
import Settings from "./views/Settings";
import AddChat from "./views/AddChat"; */
import type { View } from "../../App";
import styles from "./MainArea.module.css";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

function MainArea({ view }: { view: View }) {
  const [header, setHeader] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();

  const body = () => {
    switch (view.type) {
      case "welcome":
        return (
          <Welcome key="welcome" setHeader={setHeader} setFooter={setFooter} />
        );

      case "chat":
        if (view.id === undefined)
          throw new Error("ID do chat não foi fornecido.");

        return (
          <Chat
            key={view.id}
            id={view.id}
            setHeader={setHeader}
            setFooter={setFooter}
          />
        );

      /*
      case "group":
          body = <GroupChat ... setHeader={setHeader} setFooter={setFooter} />;
          break;

      case "settings":
          body = <Settings ... setHeader={setHeader} setFooter={setFooter} />;
          break;
      */

      default:
        if (header) setHeader(null);
        if (footer) setFooter(null);
        return null;
    }
  };

  return (
    <div className={styles.mainArea}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={view.id}
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
          key={view.id}
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
