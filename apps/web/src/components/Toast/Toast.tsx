import { useEffect } from "react";
import styles from "./Toast.module.css";
import { useLayoutStore } from "../../stores/LayoutStore";
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

const Toast = () => {
  const currentToast = useLayoutStore((state) => state.toasts.length > 0 ? state.toasts[0] : undefined);
  const removeToast = useLayoutStore((state) => state.removeToast);

  useEffect(() => {
    if (!currentToast) {
      return;
    }

    const timer = setTimeout(() => {
      removeToast(currentToast.id);
    }, currentToast.duration);

    return () => {
      clearTimeout(timer);
    };
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
};

export default Toast;
