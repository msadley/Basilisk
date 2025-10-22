import styles from "./Welcome.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";
import { useEffect } from "react";

function Welcome({ setHeader, setFooter }: ViewProps) {
  useEffect(() => {
    return () => setHeader(undefined);
  }, [setHeader]);

  useEffect(() => {
    return () => setFooter(undefined);
  });

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
