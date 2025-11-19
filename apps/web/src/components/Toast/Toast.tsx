import { useEffect } from "react";
import styles from "./Toast.module.css";
import { observer } from "mobx-react-lite";
import { layoutStore } from "../../stores/LayoutStore";
import { AnimatePresence, easeInOut, motion } from "framer-motion";

const toastVariants = {
  hidden: {
    y: -10,
    opacity: 0,
    transition: {
      y: { duration: 0.7, ease: easeInOut },
      opacity: { duration: 0.5 },
    },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      y: { duration: 0.7, ease: easeInOut },
      opacity: { duration: 0.5 },
    },
  },
};

const Toast = observer(() => {
  const { currentToast, removeToast } = layoutStore;

  useEffect(() => {
    if (!currentToast) {
      return;
    }

    if (currentToast) {
      const timer = setTimeout(() => {
        removeToast(currentToast.id);
      }, currentToast.duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentToast, removeToast]);

  return (
    <AnimatePresence mode="wait">
      {currentToast && (
        <motion.div
          key={currentToast.id}
          className={styles.wrapper}
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div
            className={styles.body}
            style={{
              color:
                currentToast.type === "error"
                  ? "var(--ctp-red)"
                  : "var(--ctp-text0)",
            }}
          >
            {currentToast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default Toast;
