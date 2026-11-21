import { zodResolver } from "@hookform/resolvers/zod";
import type { KeyboardEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import z from "zod";
import { useSendMessage } from "../../../../../stores/MessageStore";
import styles from "./InputBox.module.css";

const formSchema = z.object({
  messageText: z.string().trim().nonempty(),
});

type Inputs = z.infer<typeof formSchema>;

export type InputBoxProps = {
  chatId: string;
};

const InputBox = ({ chatId }: InputBoxProps) => {
  const { register, handleSubmit, reset } = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageText: "",
    },
  });

  const { mutate: sendMessage } = useSendMessage(chatId);

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    sendMessage({ content: data.messageText });
    reset();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className={styles.inputBox}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flex: 1 }}
      >
        <TextareaAutosize
          rows={10}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          {...register("messageText")}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default InputBox;
