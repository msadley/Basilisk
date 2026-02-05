import { layoutStore } from "../../../stores/LayoutStore";
import { observer } from "mobx-react-lite";

const SidePanel = observer(() => {
  const { sidePanelView: view } = layoutStore;

  const panel = () => {
    switch (view.type) {
      case "none": {
        return undefined;
      }
    }
  };

  return panel();
});

export default SidePanel;
