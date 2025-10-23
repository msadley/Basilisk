import styles from "./Home.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";
import { useEffect } from "react";

function Home({
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
}: ViewProps) {
  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.home}
    >
      <img src="/basilisk.svg" alt="logo" />
      <h1>Bem-vindo ao Basilisk</h1>
    </motion.div>
  );
}

export default Home;
