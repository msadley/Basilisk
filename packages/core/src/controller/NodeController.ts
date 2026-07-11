import type NodeService from "../service/NodeService.js";

class NodeController {
  private nodeService: NodeService;

  constructor(nodeService: NodeService) {
    this.nodeService = nodeService;
  }

  async pingRelay() {
    const latency = await this.nodeService.pingRelay();
    return { latency };
  }
}

export default NodeController;
