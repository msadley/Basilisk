import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SystemEvent, Message, Chat, Profile } from "@basilisk/core";

const worker = new Worker(new URL("../worker/worker.js", import.meta.url), {
  type: "module",
});

interface DataContextType {
  profiles: Record<string, Profile>;
  messages: Record<string, Message[]>;
  chats: Chat[];
  peerId: string | null;
  sendMessage: (to: string, text: string) => void;
  getMessages: (peerId: string, page: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [chats, setChats] = useState<Chat[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<SystemEvent>) => {
      const { type, payload } = event.data;

      switch (type) {
        case "message-registered": {
          const message: Message = payload.message;
          setMessages((prev) => ({
            ...prev,
            [message.chat]: [...(prev[message.chat] || []), message],
          }));
          break;
        }

        case "messages-retrieved": {
          const messages: Message[] = payload.messages;

          setMessages((prev) => {
            const grouped = messages.reduce((acc, msg) => {
              (acc[msg.chat] ??= []).push(msg);
              return acc;
            }, {} as Record<string, Message[]>);

            const updated = { ...prev };
            for (const [chatId, newMsgs] of Object.entries(grouped)) {
              updated[chatId] = [...(updated[chatId] ?? []), ...newMsgs];
            }

            return updated;
          });

          break;
        }

        case "profile-updated":
          const profile = payload.profile;

          setProfiles((prev) => {
            const updated = { ...prev };
            updated[profile.id] = profile;
            return updated;
          });
          break;

        case "node-started":
          setPeerId(payload.peerId);
          break;

        case "chat-started":
          setChats((prevChats) => [...prevChats, payload.chat]);
          break;

        default:
          break;
      }
    };

    worker.addEventListener("message", handleMessage);
    worker.postMessage({ type: "start-node" });

    return () => {
      worker.removeEventListener("message", handleMessage);
    };
  }, []);

  const sendMessage = (to: string, text: string) => {
    worker.postMessage({
      type: "send-message",
      payload: { toPeerId: to, text },
    });
  };

  const getMessages = (peerId: string, page: number) => {
    worker.postMessage({
      type: "get-messages",
      payload: {
        peerId: peerId,
        page: page,
      },
    });
  };

  const value = { profiles, messages, chats, peerId, sendMessage, getMessages };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
