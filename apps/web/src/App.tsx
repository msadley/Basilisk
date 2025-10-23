import { useState } from "react";

import styles from "./App.module.css";

import Sidebar from "./components/Sidebar/Sidebar";
import MainArea from "./components/MainArea/MainArea";
import { UserProvider } from "./contexts/UserContext";
import type { View } from "./types";
import { DataProvider } from "./contexts/DataContext";
import { LayoutProvider } from "./contexts/LayoutContext";

function App() {
  const [activeView, setActiveView] = useState({ type: "welcome" });

  function handleChangeView(view: View) {
    setActiveView(view);
  }

  return (
    <UserProvider>
      <DataProvider>
        <LayoutProvider>
          <div className={styles.app}>
            <Sidebar onViewChange={handleChangeView} />
            <MainArea view={activeView} />
          </div>
        </LayoutProvider>
      </DataProvider>
    </UserProvider>
  );
}

export default App;
