import { useLayoutStore } from "../../../stores/LayoutStore";

const SidePanel = () => {
  const view = useLayoutStore((state) => state.sidePanelView);

  const panel = () => {
    switch (view.type) {
      case "none": {
        return undefined;
      }
    }
  };

  return panel();
};

export default SidePanel;
