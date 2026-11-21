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
  isOptimisticOnly?: boolean;
};

export type SendMessageVariables = {
  content: string;
  retryClientId?: string;
};

let tempIdCounter = -1;

const nextTempMessageId = () => tempIdCounter--;

const hasOptimisticOnlyPage = (
  data: InfiniteData<MessagePage> | undefined,
): boolean => Boolean(data?.pages.some((page) => page.isOptimisticOnly));

const hasLoadedHistory = (
  data: InfiniteData<MessagePage> | undefined,
): boolean =>
  Boolean(data && data.pages.length > 0 && !hasOptimisticOnlyPage(data));

export const appendMessageToCache = (
  client: QueryClient,
  chatId: string,
  message: Message,
) => {
  const key = queryKeys.messages(chatId);
  const existing = client.getQueryData<InfiniteData<MessagePage>>(key);

  if (!existing || existing.pages.length === 0) {
    void client.invalidateQueries({ queryKey: key });
    return;
  }

  const needsHistoryReload = hasOptimisticOnlyPage(existing);

  client.setQueryData<InfiniteData<MessagePage>>(key, (oldData) => {
    if (!oldData || oldData.pages.length === 0) return oldData;

    const alreadyExists = oldData.pages.some((page) =>
      page.items.some((item) => item.id === message.id),
    );
    if (alreadyExists) return oldData;

    const uiMessage: UiMessage = { ...message, status: "ok" };

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

  if (needsHistoryReload) {
    void client.invalidateQueries({ queryKey: key });
  }
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

      const services = await workerController.getServices();
      const rows = await services.messageService.list(
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
    mutationFn: async ({ content }: SendMessageVariables): Promise<Message> => {
      const services = await workerController.getServices();
      return services.messageService.send(chatId, content);
    },

    onMutate: async ({ content, retryClientId }) => {
      const key = queryKeys.messages(chatId);
      await queryClient.cancelQueries({ queryKey: key });

      const existingData =
        queryClient.getQueryData<InfiniteData<MessagePage>>(key);
      const hadExistingData = hasLoadedHistory(existingData);
      const clientId = retryClientId ?? uuidv7();

      if (retryClientId) {
        queryClient.setQueryData<InfiniteData<MessagePage>>(key, (oldData) =>
          updateMessageByClientId(oldData, retryClientId, (msg) => ({
            ...msg,
            status: "sending",
          })),
        );
        return { clientId, hadExistingData };
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
            pages: [
              {
                items: [optimisticMessage],
                nextCursor: undefined,
                isOptimisticOnly: true,
              },
            ],
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

      return { clientId, hadExistingData };
    },

    onSuccess: (savedMessage, _vars, context) => {
      if (!context?.clientId) return;
      const key = queryKeys.messages(chatId);
      let needsHistoryReload = !context.hadExistingData;

      queryClient.setQueryData<InfiniteData<MessagePage>>(key, (oldData) => {
        if (!hasLoadedHistory(oldData)) {
          needsHistoryReload = true;
        }
        return updateMessageByClientId(oldData, context.clientId, () => ({
          ...savedMessage,
          clientId: context.clientId,
          status: "ok",
        }));
      });

      if (needsHistoryReload) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
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
