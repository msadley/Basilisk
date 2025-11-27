import styles from "./Home.module.css";
import type { ViewProps } from "../../../../types";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { userStore } from "../../../../stores/UserStore";
import { observer } from "mobx-react-lite";
import { Icon } from "@iconify/react";
import { layoutStore } from "../../../../stores/LayoutStore";

const Home = observer(({ setHeader, setFooter }: ViewProps) => {
  const [idVisible, setIdVisible] = useState<boolean>(false);
  const profile = userStore.userProfile;
  const { addToast } = layoutStore;

  const toggleIdVisibility = useCallback(() => {
    setIdVisible((prev) => !prev);
  }, []);

  const copyIdToClipboard = useCallback(() => {
    const data = profile?.id ?? "";
    navigator.clipboard.writeText(data);
    addToast("ID copiado para a área de transferência", "info");
  }, []);

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
      <img src="/basilisk.svg" alt="logo" />
      <button className={styles.idButton} onClick={toggleIdVisibility}>
        {idVisible ? profile?.id : "Mostrar ID"}
      </button>
      <button onClick={copyIdToClipboard} className={styles.copyButton}>
        <Icon icon="mingcute:copy-2-fill"></Icon>
      </button>
    </motion.div>
  );
});

export default Home;
