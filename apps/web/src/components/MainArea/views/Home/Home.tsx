import styles from "./Home.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useData } from "../../../../contexts/DataContext";

function Home({
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
}: ViewProps) {
  const { peerId } = useData();

  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, [setHeader, setFooter, setLeftPanel, setRightPanel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.home}
    >
      <img src="/basilisk.svg" alt="logo" />
      <p>Bem-vindo ao Basilisk</p>
      <p>Seu ID de Usuário: {peerId}</p>
    </motion.div>
  );
}

export default Home;
