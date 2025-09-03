// App.js
import "./App.css";
import { Icon } from "@iconify/react";
import "./assets/basilisk.svg"

export default function App() {
  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/basilisk.svg" alt="logo"/>
        </div>
        <div className="sidebar-body">
          <div className="contacts"></div>
        </div>
        <div className="sidebar-footer">
          <Icon
            icon="mingcute:add-circle-fill"
            className="button addChatButton"
          />
          <Icon
            icon="mingcute:settings-1-fill"
            className="button settingsButton"
          />
        </div>
      </div>
      <div className="chat">
        <div className="chat-header"></div>
        <div className="chat-body">
          <div />
        </div>
        <div className="chat-input">
          <input type="text" placeholder="Digite uma mensagem..." />
          <button>Enviar</button>
        </div>
      </div>
    </div>
  );
}
