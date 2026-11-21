import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLayoutStore } from "../../../../stores/LayoutStore";
import { useUserProfile } from "../../../../stores/ProfileStore";
import styles from "./Home.module.css";

const Home = () => {
  const [idVisible, setIdVisible] = useState(false);
  const { data: profile } = useUserProfile();

  const toggleIdVisibility = () => {
    setIdVisible((prev) => !prev);
  };

  const copyIdToClipboard = async () => {
    if (!profile?.id) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      useLayoutStore
        .getState()
        .addToast("ID copiado para a área de transferência", "info");
    } catch {
      useLayoutStore
        .getState()
        .addToast("Não foi possível copiar o ID", "error");
    }
  };

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
        {idVisible ? (profile?.id ?? "...") : "Mostrar ID"}
      </button>
      <button onClick={copyIdToClipboard} className={styles.copyButton}>
        <Icon icon="mingcute:copy-2-fill" />
      </button>
    </motion.div>
  );
};

export default Home;
