import { useEffect } from "react";
import styles from "./InputBox.module.css";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const formSchema = z.object({
  messageText: z.string().trim().nonempty(),
});

type Inputs = z.infer<typeof formSchema>;

type InputBoxProps = {
  sendMessage: (message: string) => void;
};

const InputBox = ({ sendMessage }: InputBoxProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitSuccessful },
  } = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageText: "",
    },
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    sendMessage(data.messageText);
  };

  useEffect(() => {
    if (isSubmitSuccessful) reset();
  }, [isSubmitSuccessful, reset]);

  return (
    <div className={styles.inputBox}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flex: 1 }}
      >
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          {...register("messageText")}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default InputBox;
