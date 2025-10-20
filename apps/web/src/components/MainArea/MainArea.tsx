import Welcome from "./views/Welcome/Welcome";
import Chat from "./views/Chat/Chat";
/* import GroupChat from "./views/GroupChat";
import Settings from "./views/Settings";
import AddChat from "./views/AddChat"; */
import type { View } from "../../types";

function MainArea({ view }: { view: View }) {
  function render() {
    switch (view.type) {
      case "welcome":
        return <Welcome />;

      case "chat":
        // TODO Melhorar isso
        if (view.id === undefined) {
          return <div>Selecione um chat</div>;
        }
        return <Chat id={view.id} />;

      /* case "group":
        return <GroupChat groupId={view.id} groupName={view.name} />;

      case "settings":
        return <Settings />;

      case "add-chat":
        return <AddChat />; */

      default:
        return <div>Selecione uma opção</div>;
    }
  }
  return render();
}

export default MainArea;
