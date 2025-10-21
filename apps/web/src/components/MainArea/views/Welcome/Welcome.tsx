import { motion } from "framer-motion";
import styles from "./Welcome.module.css";

function Welcome() {
  return (
    <motion.div
      key="welcome" // This key is for the motion.div itself, not for AnimatePresence tracking the Welcome component
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.welcome}
    >
      <img src="/basilisk.svg" alt="logo" />
      <h1>Bem-vindo ao Basilisk</h1>
    </motion.div>
  );
}

export default Welcome;
