import { useState } from "react";

import styles from "./App.module.css";

import Sidebar from "./components/Sidebar/Sidebar";
import MainArea from "./components/MainArea/MainArea";
import { UserProvider } from "./contexts/UserContext";

export type View = {
  type: string;
  id?: string;
  name?: string;
};

function App() {
  const [activeView, setActiveView] = useState({ type: "welcome" });

  function handleChangeView(view: View) {
    setActiveView(view);
  }

  return (
    <UserProvider>
      <div className={styles.app}>
        <Sidebar onViewChange={handleChangeView} />
        <MainArea view={activeView} />
      </div>
    </UserProvider>
  );
}

export default App;
