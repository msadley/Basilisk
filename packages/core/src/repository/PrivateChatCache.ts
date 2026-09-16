import { PrivateChatRepository } from "./PrivateChatRepository.js";

export class PrivateChatCache {
  private cache: Set<string> = new Set();
  private isLoading: boolean = false;
  private isInitialized: boolean = false;

  constructor(private privateChatRepository: PrivateChatRepository) {}

  async init() {
    if (this.isInitialized || this.isLoading) return;

    try {
      const peers = await this.privateChatRepository.list();
      this.cache = new Set(peers.map(({ id }) => id));
      this.isInitialized = true;
    } finally {
      this.isLoading = false;
    }
  }

  contains(id: string): boolean {
    return this.cache.has(id);
  }

  add(id: string) {
    this.cache.add(id);
  }

  remove(id: string) {
    this.cache.delete(id);
  }

  async invalidate() {
    this.cache.clear();
    this.isInitialized = false;
    await this.init();
  }
}
