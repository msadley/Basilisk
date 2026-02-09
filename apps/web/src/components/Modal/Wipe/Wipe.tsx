import { observer } from "mobx-react-lite";
import { layoutStore } from "../../../stores/LayoutStore";
import styles from "./Wipe.module.css";
import { workerController } from "../../../worker/workerController";

const Wipe = observer(() => {
  const { setModalView, modalView } = layoutStore;

  const handleConfirm = async () => {
    setModalView({ type: "loading" });
    try {
      await workerController.wipe();
      window.location.reload();
    } catch (error: any) {
      console.error("Error when wiping database");
    }
  };

  return (
    modalView.type === "wipe" && (
      <div className={styles.wrapper}>
        <div className={styles.body}>
          <div className={styles.textWrapper}>
            <p>
              Você realmente deseja apagar todos as suas conversas e mensagens?
            </p>
            <p>Essa ação é irreversível.</p>
          </div>
          <div className={styles.buttonWrapper}>
            <button onClick={handleConfirm} className={styles.confirm}>
              Confirmar
            </button>
            <div className={styles.separator} />
            <button
              onClick={() => setModalView({ type: "none" })}
              className={styles.cancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  );
});

export default Wipe;
