import { AnimatePresence } from "framer-motion";
import { useChats } from "../stores/ChatStore";
import { useUserProfile } from "../stores/ProfileStore";
import styles from "./App.module.css";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import MainArea from "./MainArea/MainArea";
import Modal from "./Modal/Modal";
import Reconnecting from "./Reconnecting/Reconnecting";
import Sidebar from "./Sidebar/Sidebar";

const App = () => {
  const { isLoading: userLoading } = useUserProfile();
  const { isLoading: chatLoading } = useChats();

  const isLoading = userLoading || chatLoading;

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
