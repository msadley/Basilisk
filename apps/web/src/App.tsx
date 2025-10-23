import styles from "./App.module.css";
import Sidebar from "./components/Sidebar/Sidebar";
import MainArea from "./components/MainArea/MainArea";
import { UserProvider } from "./contexts/UserContext";
import { DataProvider } from "./contexts/DataContext";
import { LayoutProvider } from "./contexts/LayoutContext";

function App() {
  return (
    <UserProvider>
      <DataProvider>
        <LayoutProvider>
          <div className={styles.app}>
            <Sidebar />
            <MainArea />
          </div>
        </LayoutProvider>
      </DataProvider>
    </UserProvider>
  );
}

export default App;
