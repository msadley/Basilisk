import styles from "./Home.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "../../../../stores/UserStore";
import { Icon } from "@iconify/react";
import { useLayoutStore } from "../../../../stores/LayoutStore";

const Home = ({ setHeader, setFooter }: ViewProps) => {
  const [idVisible, setIdVisible] = useState<boolean>(false);
  const profile = useUserStore((state) => state.userProfile);
  const addToast = useLayoutStore((state) => state.addToast);

  const toggleIdVisibility = useCallback(() => {
    setIdVisible((prev) => !prev);
  }, []);

  const copyIdToClipboard = useCallback(() => {
    const data = profile?.id ?? "";
    navigator.clipboard.writeText(data);
    addToast("ID copiado para a área de transferência", "info");
  }, [profile, addToast]);

  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
  }, [setHeader, setFooter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.home}
    >
      <img src="basilisk.svg" alt="logo" />
      <button className={styles.idButton} onClick={toggleIdVisibility}>
        {idVisible ? profile?.id : "Mostrar ID"}
      </button>
      <button onClick={copyIdToClipboard} className={styles.copyButton}>
        <Icon icon="mingcute:copy-2-fill" />
      </button>
    </motion.div>
  );
};

export default Home;
