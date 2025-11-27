import Sidebar from "./Sidebar/Sidebar";
import MainArea from "./MainArea/MainArea";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import styles from "./App.module.css";
import { observer } from "mobx-react-lite";

import { userStore as user } from "../stores/UserStore";
import { chatStore as chat } from "../stores/ChatStore";
import { AnimatePresence } from "framer-motion";

const App = observer(() => {
  const isLoading = user.isProfileLoading || chat.areChatsLoading;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" />
      ) : (
        <div className={styles.app}>
          <Sidebar />
          <MainArea />
        </div>
      )}
    </AnimatePresence>
  );
});

export default App;
