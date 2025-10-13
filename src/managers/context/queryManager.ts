import { EmbeddingManager } from "./embeddingManager";

export class QueryManager {
  constructor(private embeddingManager: EmbeddingManager) {}

  public async query(codeSnippet: string): Promise<any[]> {
    return this.embeddingManager.findSimilar(codeSnippet);
  }
}
