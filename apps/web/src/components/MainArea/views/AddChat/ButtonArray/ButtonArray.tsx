import { motion } from "framer-motion";
import styles from "./ButtonArray.module.css";

type ButtonArrayProps = {
  activeButtonIndex: number;
  setActiveButtonIndex: (index: number) => void;
};

const ButtonArray = ({
  activeButtonIndex,
  setActiveButtonIndex,
}: ButtonArrayProps) => {
  return (
    <div className={styles.header}>
      <div className={styles.tabContainer}>
        <div className={styles.tab}>Adicionar Chat</div>
      </div>
      <div className={styles.buttonContainer}>
        <motion.button
          onClick={() => setActiveButtonIndex(0)}
          className={styles.button}
          animate={{
            backgroundColor: !activeButtonIndex
              ? "var(--ctp-crust)"
              : "var(--ctp-base)",
          }}
          transition={{ duration: 0.2 }}
        >
          Chat privado
        </motion.button>

        <motion.button
          onClick={() => setActiveButtonIndex(1)}
          className={styles.button}
          animate={{
            backgroundColor: activeButtonIndex
              ? "var(--ctp-crust)"
              : "var(--ctp-base)",
          }}
          transition={{ duration: 0.2 }}
        >
          Chat em grupo
        </motion.button>
        <div className={styles.spacer}></div>
      </div>
    </div>
  );
};

export default ButtonArray;