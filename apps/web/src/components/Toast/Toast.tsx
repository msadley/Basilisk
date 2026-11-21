import { AnimatePresence, easeInOut, motion } from "framer-motion";
import { useEffect } from "react";
import { useLayoutStore } from "../../stores/LayoutStore";
import styles from "./Toast.module.css";

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

const Toast = () => {
  const currentToast = useLayoutStore((state) => state.toasts[0]);

  useEffect(() => {
    if (!currentToast) {
      return;
    }

    const timer = setTimeout(() => {
      useLayoutStore.getState().removeToast(currentToast.id);
    }, currentToast.duration ?? 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [currentToast]);

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
                  : "var(--ctp-text)",
            }}
          >
            {currentToast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
