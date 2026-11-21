import type { Chat } from "@basilisk/core/models";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerController } from "../worker/workerController";
import { queryKeys } from "./keys";

export const useChats = () => {
  return useQuery({
    queryKey: queryKeys.chats,
    queryFn: async (): Promise<Chat[]> => {
      const services = await workerController.getServices();
      return services.chatService.list();
    },
  });
};

export const useChat = (chatId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.chat(chatId ?? ""),
    enabled: Boolean(chatId),
    queryFn: async (): Promise<Chat | null> => {
      if (!chatId) return null;
      const services = await workerController.getServices();
      return (await services.chatService.getById(chatId)) ?? null;
    },
    initialData: () => {
      if (!chatId) return undefined;
      return queryClient
        .getQueryData<Chat[]>(queryKeys.chats)
        ?.find((chat) => chat.id === chatId);
    },
  });
};

export const useCreatePrivateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createPrivateChat"],
    mutationFn: async (peerId: string) => {
      const services = await workerController.getServices();
      return services.chatService.createPrivateChat(peerId);
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData<Chat[]>(queryKeys.chats, (old) => {
        if (!old) return [newChat];
        return old.some((chat) => chat.id === newChat.id)
          ? old
          : [...old, newChat];
      });
      queryClient.setQueryData<Chat>(queryKeys.chat(newChat.id), newChat);
    },
  });
};
