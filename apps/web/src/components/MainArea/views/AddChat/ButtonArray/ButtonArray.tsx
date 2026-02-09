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
        Privado
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
        Grupo
      </motion.button>
    </div>
  );
};

export default ButtonArray;
