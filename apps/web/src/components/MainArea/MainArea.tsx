import Welcome from "./views/Welcome/Welcome";
import Chat from "./views/Chat/Chat";
/* import GroupChat from "./views/GroupChat";
import Settings from "./views/Settings";
import AddChat from "./views/AddChat"; */
import type { View } from "../../App";
import styles from "./MainArea.module.css";
import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

function MainArea({ view }: { view: View }) {
  const [header, setHeader] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();

  useEffect(() => {
    setHeader(undefined);
    setFooter(undefined);
  }, [view]);

  let body;
  switch (view.type) {
    case "welcome":
      body = <Welcome key="welcome" />;
      break;

    case "chat":
      if (view.id === undefined)
        throw new Error("ID do chat não foi fornecido.");

      body = (
        <Chat
          key={view.id}
          id={view.id}
          setHeader={setHeader}
          setFooter={setFooter}
        />
      );
      break;

    /* case "group":
        return <GroupChat groupId={view.id} groupName={view.name} />;

      case "settings":
        return <Settings />;

      case "add-chat":
        return <AddChat />; */

    default:
      body = <div></div>;
      break;
  }
  return (
    <div className={styles.mainArea}>
      <motion.div key={view.id + view.type} layout className={styles.header}>
        <AnimatePresence>{header}</AnimatePresence>
      </motion.div>

      <motion.div layout className={styles.body}>
        <AnimatePresence mode="wait">{body}</AnimatePresence>
      </motion.div>

      <AnimatePresence>
        <motion.div layout className={styles.footer}>
          {footer}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default MainArea;
