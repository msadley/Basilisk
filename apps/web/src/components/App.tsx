import Sidebar from "./Sidebar/Sidebar";
import MainArea from "./MainArea/MainArea";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import styles from "./App.module.css";

import { useUserStore } from "../stores/UserStore";
import { useChatStore } from "../stores/ChatStore";
import { AnimatePresence } from "framer-motion";
import Modal from "./Modal/Modal";
import Reconnecting from "./Reconnecting/Reconnecting";

const App = () => {
  const userLoading = useUserStore((state) => state.isLoading);
  const chatLoading = useChatStore((state) => state.isLoading);
  const isLoading = userLoading || chatLoading;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" />
      ) : (
        <div className={styles.app}>
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
