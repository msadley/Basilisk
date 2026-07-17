import { Dialog, DialogPanel } from "@headlessui/react";
import { useLayoutStore } from "../../stores/LayoutStore";
import Loading from "./Loading/Loading";
import styles from "./Modal.module.css";

const Modal = () => {
  const modalView = useLayoutStore((state) => state.modalView);
  const setModalView = useLayoutStore((state) => state.setModalView);

  const isOpen = modalView.type !== "none";

  const handleClose = () => {
    // Prevent closing when in loading state
    if (modalView.type === "loading") {
      return;
    }
    setModalView({ type: "none" });
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className={styles.dialog}>
      {/* Backdrop */}
      <div className={styles.backdrop} aria-hidden="true" />

      {/* Centered content container */}
      <div className={styles.container}>
        <DialogPanel className={styles.panel}>
          {modalView.type === "loading" && <Loading />}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default Modal;
