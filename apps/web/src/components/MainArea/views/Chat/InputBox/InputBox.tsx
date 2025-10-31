import styles from "./InputBox.module.css";
import { useForm, type SubmitHandler } from "react-hook-form";

type Inputs = {
  message: string;
};

type InputBoxProps = {
  sendMessage: (message: string) => void;
};

const InputBox = ({ sendMessage }: InputBoxProps) => {
  const { register, handleSubmit } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    sendMessage(data.message);
  };

  return (
    <div className={styles.inputBox}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flex: 1 }}
      >
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          {...register("message")}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default InputBox;
