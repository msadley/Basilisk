import { zodResolver } from "@hookform/resolvers/zod";
import { peerIdFromString } from "@libp2p/peer-id";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { useCreatePrivateChat } from "../../../../../stores/ChatStore";
import { useLayoutStore } from "../../../../../stores/LayoutStore";
import styles from "./PrivateForm.module.css";

const formSchema = z.object({
  peerId: z
    .string()
    .min(1, "Este campo é obrigatório")
    .refine(
      (val) => {
        try {
          peerIdFromString(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "Peer ID inválido ou mal formatado",
      },
    ),
});

const getCreateChatErrorMessage = (error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (message.includes("Cannot create a private chat with yourself")) {
    return "Você não pode criar um chat consigo mesmo.";
  }
  if (message.includes("Chat already exists")) {
    return "Este chat já existe.";
  }
  return "Não foi possível criar o chat.";
};

type Inputs = z.infer<typeof formSchema>;

const PrivateForm = () => {
  const { mutateAsync: createPrivateChat, isPending } = useCreatePrivateChat();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const createdChat = await createPrivateChat(data.peerId);
      useLayoutStore.getState().setMainView({
        type: "chat",
        details: { chatId: createdChat.id },
      });
    } catch (e) {
      console.error("Failed to create chat:", e);
      setError("root", { message: getCreateChatErrorMessage(e) });
    }
  };

  const errorMessage = errors.peerId?.message ?? errors.root?.message;

  return (
    <motion.div
      layout
      style={{ display: "flex", flex: 1, flexDirection: "column" }}
    >
      <motion.form
        layout
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        <input
          className={styles.input}
          disabled={isPending}
          {...register("peerId", { required: true })}
          placeholder="Digite o id do chat"
        />
        <button type="submit" disabled={isPending} className={styles.button}>
          {isPending ? "Criando..." : "Enviar"}
        </button>
      </motion.form>
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.error}
            key="error-message"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrivateForm;
