import { useState } from "react";

import styles from "./App.module.css";

import Sidebar from "./components/Sidebar/Sidebar";
import MainArea from "./components/MainArea/MainArea";

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
    <div className={styles.app}>
      <Sidebar onViewChange={handleChangeView} />
      <MainArea view={activeView} />
    </div>
  );
}

export default App;
