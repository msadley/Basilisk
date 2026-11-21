import { Icon } from "@iconify/react";
import { AnimatePresence } from "framer-motion";
import { useChats } from "../stores/ChatStore";
import { useUserProfile } from "../stores/ProfileStore";
import { rootStore, useStartupStore } from "../stores/RootStore";
import styles from "./App.module.css";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import MainArea from "./MainArea/MainArea";
import Modal from "./Modal/Modal";
import Reconnecting from "./Reconnecting/Reconnecting";
import Sidebar from "./Sidebar/Sidebar";

const App = () => {
  const {
    data: userProfile,
    isLoading: userLoading,
    isError: userIsError,
    error: userError,
    refetch: refetchUser,
  } = useUserProfile();
  const {
    isLoading: chatLoading,
    isError: chatIsError,
    error: chatError,
    refetch: refetchChats,
  } = useChats();
  const startupStatus = useStartupStore((state) => state.status);
  const startupError = useStartupStore((state) => state.error);

  const isLoading = userLoading || chatLoading;
  const hasQueryError = userIsError || chatIsError;
  const hasFatalStartupError = startupStatus === "error" && !userProfile;

  const errorMessage =
    (userError instanceof Error ? userError.message : undefined) ??
    (chatError instanceof Error ? chatError.message : undefined) ??
    startupError?.message ??
    "Erro inesperado ao inicializar a aplicação.";

  const handleRetry = () => {
    void rootStore.init();
    void refetchUser();
    void refetchChats();
  };

  if (hasQueryError || hasFatalStartupError) {
    return (
      <div className={styles.errorScreen} role="alert">
        <div className={styles.errorInner}>
          <div className={styles.errorBody}>
            <Icon icon="mingcute:alert-fill" className={styles.errorIcon} />
            <h1 className={styles.errorTitle}>
              Não foi possível inicializar o Basilisk
            </h1>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={handleRetry}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" />
      ) : (
        <div key="app" className={styles.app}>
          <Sidebar />
          <MainArea />
          <Modal />
          <Reconnecting />
        </div>
      )}
    </AnimatePresence>
  );
};

export default App;
