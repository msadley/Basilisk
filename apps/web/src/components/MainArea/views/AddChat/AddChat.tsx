import { useEffect, useState, type FormEvent } from "react";
import type { ViewProps } from "../../../../types";
import styles from "./AddChat.module.css";
import { motion } from "framer-motion";
import { useData } from "../../../../contexts/DataContext";
import { Icon } from "@iconify/react";

function AddChat({
  setHeader,
  setFooter,
  setLeftPanel,
  setRightPanel,
}: ViewProps) {
  const [input, setInput] = useState("");
  const [awaitChat, setAwaitingChat] = useState(false);
  const { createChat } = useData();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setInput("");
    setAwaitingChat(true);
    createChat(input);
  };

  useEffect(() => {
    setHeader(<></>);
    setFooter(<></>);
    setLeftPanel(<></>);
    setRightPanel(<></>);
  }, []);

  return !awaitChat ? (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={styles.addChat}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.wrapper}>
            <p>Add Chat</p>
          </div>
          <div className={styles.spacer}></div>
        </div>
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="text"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite o id do chat"
          ></input>
          <button type="submit" className={styles.button}>
            Enviar
          </button>
        </form>
      </div>
    </motion.div>
  ) : (
    <Icon icon="mingcute:loading-3-fill"></Icon>
  );
}

export default AddChat;
