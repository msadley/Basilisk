import styles from "./Welcome.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";

function Welcome({ setHeader, setFooter }: ViewProps) {
  setHeader(null);
  setFooter(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.welcome}
    >
      <img src="/basilisk.svg" alt="logo" />
      <h1>Bem-vindo ao Basilisk</h1>
    </motion.div>
  );
}

export default Welcome;
