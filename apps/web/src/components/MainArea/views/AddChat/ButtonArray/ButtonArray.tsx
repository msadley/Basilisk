import { motion } from "framer-motion";
import styles from "./ButtonArray.module.css";

export type AddChatTab = "private" | "group";

type ButtonArrayProps = {
  activeTab: AddChatTab;
  onSelectTab: (tab: AddChatTab) => void;
};

const ButtonArray = ({ activeTab, onSelectTab }: ButtonArrayProps) => {
  return (
    <div className={styles.header}>
      <motion.button
        onClick={() => onSelectTab("private")}
        className={styles.button}
        animate={{
          backgroundColor:
            activeTab === "private" ? "var(--ctp-crust)" : "var(--ctp-base)",
        }}
        transition={{ duration: 0.2 }}
      >
        Privado
      </motion.button>

      <motion.button
        onClick={() => onSelectTab("group")}
        className={styles.button}
        animate={{
          backgroundColor:
            activeTab === "group" ? "var(--ctp-crust)" : "var(--ctp-base)",
        }}
        transition={{ duration: 0.2 }}
      >
        Grupo
      </motion.button>
    </div>
  );
};

export default ButtonArray;
