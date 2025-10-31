import Sidebar from "./Sidebar/Sidebar";
import MainArea from "./MainArea/MainArea";
import LoadingScreen from "./LoadingScreen/LoadingScreen";
import styles from "./App.module.css";
import { observer } from "mobx-react-lite";

import { userStore as user } from "../stores/UserStore";
import { chatStore as chat } from "../stores/ChatStore";

const App = observer(() => {
  return user.isProfileLoading || chat.areChatsLoading ? (
    <LoadingScreen />
  ) : (
    <div className={styles.app}>
      <Sidebar />
      <MainArea />
    </div>
  );
});

export default App;
