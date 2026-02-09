import { observer } from "mobx-react-lite";
import { layoutStore } from "../../stores/LayoutStore";
import Wipe from "./Wipe/Wipe";
import Loading from "./Loading/Loading";

const Modal = observer(() => {
  const { modalView } = layoutStore;

  switch (modalView.type) {
    case "wipe":
      return <Wipe />;
    case "loading":
      return <Loading />;
    default:
      return;
  }
});

export default Modal;
