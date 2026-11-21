export const queryKeys = {
  chats: ["chats"] as const,
  chat: (id: string) => ["chats", id] as const,

  messages: (chatId: string) => ["chats", chatId, "messages"] as const,

  profiles: ["profiles"] as const,
  profile: (id: string) => ["profiles", id] as const,

  userProfile: ["userProfile"] as const,
} as const;
