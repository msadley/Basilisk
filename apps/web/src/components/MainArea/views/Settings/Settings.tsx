import { useEffect } from "react";
import type { ViewProps } from "../../../../types";
import styles from "./Settings.module.css";

function Settings({
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
}: ViewProps) {
  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, []);

  return <div className={styles.settings}></div>;
}

export default Settings;
