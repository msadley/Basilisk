import { layoutStore } from "../../../stores/LayoutStore";
import { observer } from "mobx-react-lite";
import Settings from "./Settings/Settings";

const SidePanel = observer(() => {
  const { sidePanelView: view } = layoutStore;

  const panel = () => {
    switch (view.type) {
      case "none": {
        return undefined;
      }

      case "settings": {
        return <Settings />;
      }
    }
  };

  return panel();
});

export default SidePanel;
