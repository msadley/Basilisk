import { useForm, type SubmitHandler } from "react-hook-form";
import { peerIdFromString } from "@libp2p/peer-id";
import styles from "./PrivateForm.module.css";
import type { FormProps } from "../AddChat";
import { z } from "zod";
import type { Chat } from "@basilisk/core";
import { AnimatePresence, motion } from "framer-motion";

type Inputs = z.infer<typeof formSchema>;

const peerIdSchema = z
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
  );

const formSchema = z.object({
  peerId: peerIdSchema,
});

const PrivateForm = ({ createChat, setIsLoading, setView }: FormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const result = formSchema.safeParse(data);

    if (!result.success) {
      for (const error of result.error.issues) {
        setError(error.path[0] as "peerId", {
          type: "manual",
          message: error.message,
        });
      }
      return;
    }

    const chat: Chat = {
      id: data.peerId,
      type: "private",
    };

    setIsLoading(true);
    const newChat = await createChat(chat);
    setView({ type: "chat", details: { chat: newChat! } });
    // XXX
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
