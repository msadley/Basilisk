import { container, inject, injectable, singleton } from "tsyringe";
import PrivateChatRepository from "./PrivateChatRepository.js";

@injectable()
@singleton()
class PrivateChatCache {
  private cache: Set<string> = new Set();
  private isLoading: boolean = false;
  private isInitialized: boolean = false;

  constructor(
    @inject(PrivateChatRepository)
    private privateChatRepository: PrivateChatRepository,
  ) {}

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

container.afterResolution(PrivateChatCache, async (_t, instance) => {
  await (Array.isArray(instance) ? instance[0] : instance).init();
});

export default PrivateChatCache;
