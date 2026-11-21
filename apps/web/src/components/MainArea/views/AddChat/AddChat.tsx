import { useState } from "react";
import styles from "./AddChat.module.css";
import ButtonArray, { type AddChatTab } from "./ButtonArray/ButtonArray";
import PrivateForm from "./PrivateForm/PrivateForm";

function AddChat() {
  const [activeTab, setActiveTab] = useState<AddChatTab>("private");

  return (
    <div className={styles.addChat}>
      <div className={styles.container}>
        <ButtonArray activeTab={activeTab} onSelectTab={setActiveTab} />
        <div className={styles.formContainer}>
          <div className={styles.form}>
            {activeTab === "private" ? (
              <PrivateForm />
            ) : (
              <p>Menu de grupos em construção!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddChat;
