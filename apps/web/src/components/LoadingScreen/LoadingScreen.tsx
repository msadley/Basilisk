import { Icon } from "@iconify/react";
import styles from "./LoadingScreen.module.css";
import { motion } from "framer-motion";

const loadingVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: {
        duration: 0.5,
      },
    },
  },
};

const LoadingScreen = () => {
  return (
    <motion.div
      className={styles.loadingScreen}
      variants={loadingVariants}
      animate="visible"
      exit="hidden"
      initial="hidden"
    >
      <div className={styles.inner}>
        <div className={styles.body}>
          <Icon icon="mingcute:loading-3-fill"></Icon>
          Carregando banco de dados...
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
