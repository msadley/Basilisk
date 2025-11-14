import { useForm, type SubmitHandler } from "react-hook-form";
import { peerIdFromString } from "@libp2p/peer-id";
import styles from "./PrivateForm.module.css";
import type { FormProps } from "../AddChat";
import { z } from "zod";
import type { Chat } from "@basilisk/core";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  peerId: z
    .string()
    .min(1, "Este campo é obrigatório")
    .refine(
      (val) => {
        try {
          peerIdFromString(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      {
        message: "Peer ID inválido ou mal formatado",
      }
    ),
});

type Inputs = z.infer<typeof formSchema>;

const PrivateForm = ({ createChat, setIsLoading, setView }: FormProps) => {
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
    const chat: Chat = {
      id: data.peerId,
      type: "private",
    };

    setIsLoading(true);
    try {
      const newChat = (await createChat(chat))!;
      setView({ type: "chat", details: { chat: newChat } });
    } catch (e: any) {
      console.error("Failed to create chat:", e);
      setError("root", { message: "Could not create chat." });
    } finally {
      setIsLoading(false);
    }
  };

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
          {...register("peerId", { required: true })}
          placeholder="Digite o id do chat"
        ></input>
        <button type="submit" className={styles.button}>
          Enviar
        </button>
      </motion.form>
      <AnimatePresence>
        {errors.peerId && errors.peerId.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.error}
            key={"error-message"}
          >
            {errors.peerId.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrivateForm;
