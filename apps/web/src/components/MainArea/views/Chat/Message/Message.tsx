import styles from "./Message.module.css";

type MessageProps = {
  content: string;
  timestamp: number;
};

function Message({ content }: MessageProps) {
  return <div className={styles.message}>{/* placeholder pra mensagem*/}</div>;
}

export default Message;
