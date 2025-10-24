import Sidebar from "./components/Sidebar/Sidebar";
import MainArea from "./components/MainArea/MainArea";
import { useUser } from "./contexts/UserContext";
import { DataProvider } from "./contexts/DataContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import styles from "./App.module.css";

function App() {
  const { isProfileLoading } = useUser();

  return isProfileLoading ? (
    <LoadingScreen />
  ) : (
    <DataProvider>
      <LayoutProvider>
        <div className={styles.app}>
          <Sidebar />
          <MainArea />
        </div>
      </LayoutProvider>
    </DataProvider>
  );
}

export default App;
