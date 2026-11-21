import type { Message, Profile } from "@basilisk/core";
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { v7 as uuidv7 } from "uuid";
import { workerController } from "../worker/workerController";
import { queryKeys } from "./keys";

export const MESSAGE_PAGE_SIZE = 30;
export const INITIAL_FIRST_ITEM_INDEX = 1_000_000;

export type MessageStatus = "sending" | "error" | "ok";

export type UiMessage = Message & {
  clientId?: string;
  status?: MessageStatus;
};

export type MessagePage = {
  items: UiMessage[];
  nextCursor: number | undefined;
};

export type SendMessageVariables = {
  content: string;
  retryClientId?: string;
};

let tempIdCounter = -1;

const nextTempMessageId = () => tempIdCounter--;

export const appendMessageToCache = (
  client: QueryClient,
  chatId: string,
  message: Message,
) => {
  const key = queryKeys.messages(chatId);
  const existing = client.getQueryData<InfiniteData<MessagePage>>(key);

  if (!existing) {
    client.invalidateQueries({ queryKey: key });
    return;
  }

  client.setQueryData<InfiniteData<MessagePage>>(key, (oldData) => {
    if (!oldData) return oldData;

    const alreadyExists = oldData.pages.some((page) =>
      page.items.some((item) => item.id === message.id),
    );
    if (alreadyExists) return oldData;

    const uiMessage: UiMessage = { ...message, status: "ok" };

    if (oldData.pages.length === 0) {
      return {
        ...oldData,
        pages: [{ items: [uiMessage], nextCursor: undefined }],
        pageParams: [undefined],
      };
    }

    const newPages = [...oldData.pages];
    newPages[0] = {
      ...newPages[0],
      items: [...newPages[0].items, uiMessage],
    };

    return {
      ...oldData,
      pages: newPages,
    };
  });
};

export const useMessages = (chatId?: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(chatId ?? ""),
    enabled: Boolean(chatId),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }): Promise<MessagePage> => {
      if (!chatId) {
        return { items: [], nextCursor: undefined };
      }

      const rows = await workerController.services.messageService.list(
        chatId,
        pageParam,
      );

      const hasMore = rows.length > MESSAGE_PAGE_SIZE;
      const pageRows = hasMore ? rows.slice(0, MESSAGE_PAGE_SIZE) : rows;
      const oldestRow = pageRows[pageRows.length - 1];

      return {
        items: pageRows
          .slice()
          .reverse()
          .map((msg) => ({ ...msg, status: "ok" as const })),
        nextCursor: hasMore && oldestRow ? oldestRow.id : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => {
      const messages = data.pages
        .slice()
        .reverse()
        .flatMap((page) => page.items);
      const prependedCount = data.pages
        .slice(1)
        .reduce((sum, page) => sum + page.items.length, 0);

      return {
        messages,
        firstItemIndex: INITIAL_FIRST_ITEM_INDEX - prependedCount,
      };
    },
  });
};

const updateMessageByClientId = (
  oldData: InfiniteData<MessagePage> | undefined,
  clientId: string,
  updater: (msg: UiMessage) => UiMessage,
): InfiniteData<MessagePage> | undefined => {
  if (!oldData) return oldData;

  let changed = false;
  const newPages = oldData.pages.map((page) => {
    const idx = page.items.findIndex((item) => item.clientId === clientId);
    if (idx === -1) return page;
    changed = true;
    const nextItems = [...page.items];
    nextItems[idx] = updater(nextItems[idx]);
    return { ...page, items: nextItems };
  });

  return changed ? { ...oldData, pages: newPages } : oldData;
};

export const useSendMessage = (chatId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["sendMessage", chatId],
    mutationFn: ({ content }: SendMessageVariables): Promise<Message> =>
      workerController.services.messageService.send(chatId, content),

    onMutate: async ({ content, retryClientId }) => {
      const key = queryKeys.messages(chatId);
      await queryClient.cancelQueries({ queryKey: key });

      const clientId = retryClientId ?? uuidv7();

      if (retryClientId) {
        queryClient.setQueryData<InfiniteData<MessagePage>>(key, (oldData) =>
          updateMessageByClientId(oldData, retryClientId, (msg) => ({
            ...msg,
            status: "sending",
          })),
        );
        return { clientId };
      }

      const userProfile = queryClient.getQueryData<Profile>(
        queryKeys.userProfile,
      );

      const optimisticMessage: UiMessage = {
        id: nextTempMessageId(),
        clientId,
        chatId,
        senderId: userProfile?.id ?? "",
        contentType: "text",
        content,
        timestamp: new Date(),
        received: false,
        status: "sending",
      };

      queryClient.setQueryData<InfiniteData<MessagePage>>(key, (oldData) => {
        if (!oldData || oldData.pages.length === 0) {
          return {
            pages: [{ items: [optimisticMessage], nextCursor: undefined }],
            pageParams: [undefined],
          };
        }

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [...newPages[0].items, optimisticMessage],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });

      return { clientId };
    },

    onSuccess: (savedMessage, _vars, context) => {
      if (!context?.clientId) return;
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        queryKeys.messages(chatId),
        (oldData) =>
          updateMessageByClientId(oldData, context.clientId, () => ({
            ...savedMessage,
            clientId: context.clientId,
            status: "ok",
          })),
      );
    },

    onError: (_err, _vars, context) => {
      if (!context?.clientId) return;
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        queryKeys.messages(chatId),
        (oldData) =>
          updateMessageByClientId(oldData, context.clientId, (msg) => ({
            ...msg,
            status: "error",
          })),
      );
    },
  });
};
