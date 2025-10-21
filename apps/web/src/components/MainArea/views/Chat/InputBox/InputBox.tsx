import styles from "./InputBox.module.css";

function InputBox() {
  return (
    <div className={styles.inputBox}>
      <input type="text" placeholder="Digite uma mensagem..." />
      <button>Enviar</button>
    </div>
  );
}

export default InputBox;
