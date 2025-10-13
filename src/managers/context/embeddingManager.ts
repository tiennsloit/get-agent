import * as vscode from 'vscode';
import * as path from 'path';
import { configState } from '../state/configState';

interface Embedding {
    embedding: any;
    text: string;
    metadata: {
        filePath: string;
        chunkIndex: number;
    };
}

export class EmbeddingManager {
    private embeddings: Embedding[] = [];
    private context: any = null;
    private model: any = null;
    private MAX_CHUNK_SIZE: number = 400;

    constructor(private extensionContext: vscode.ExtensionContext) { }


    private chunkText(text: string): string[] {
        const words = text.split(/\s+/);
        const chunks: string[] = [];
        let currentChunk: string[] = [];

        for (const word of words) {
            if (currentChunk.join(' ').length + word.length + 1 > this.MAX_CHUNK_SIZE) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [word];
            } else {
                currentChunk.push(word);
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }

        return chunks;
    }

    public async initialize(report: (params: { message: string, increment?: number }) => void): Promise<void> {
        try {
            report({ message: "Initializing embedder..." });
            const embeddingModel = configState.embeddingModel;
            const modelPath = path.join(this.extensionContext.globalStorageUri.fsPath, 'embedding', embeddingModel!.fileName);
            const { getLlama } = await import('node-llama-cpp');
            const llama = await getLlama();
            this.model = await llama.loadModel({ modelPath });
            this.context = await this.model.createEmbeddingContext();

            report({ message: "Embedder initialized", increment: 100 });
        } catch (error) {
            throw new Error(`Failed to initialize embedder: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async addEmbeddings(texts: string[], filePath: string): Promise<void> {
        if (!this.context) {
            throw new Error('Embedder not initialized');
        }

        // First remove any existing embeddings for this file
        await this.removeEmbeddings(filePath);

        // Process all texts, chunking them as needed
        for (let i = 0; i < texts.length; i++) {
            const chunks = await this.chunkText(texts[i]);

            for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                try {
                    const embedding = await this.context.getEmbeddingFor(chunk);
                    this.embeddings.push({
                        embedding,
                        text: chunk,
                        metadata: {
                            filePath,
                            chunkIndex
                        }
                    });
                } catch (error) {
                    console.error(`Failed to embed chunk ${chunkIndex} of text ${i}:`, error);
                }
            }
        }
    }

    public async removeEmbeddings(filePath: string): Promise<void> {
        this.embeddings = this.embeddings.filter(e => e.metadata.filePath !== filePath);
    }

    public async findSimilar(query: string, topK = 5): Promise<{ text: string, similarity: number, metadata: any }[]> {
        if (!this.context) {
            throw new Error('Embedder not initialized');
        }

        const queryEmbedding = await this.context.getEmbeddingFor(query);

        const similarities = this.embeddings.map(doc => ({
            text: doc.text,
            similarity: queryEmbedding.calculateCosineSimilarity(doc.embedding),
            metadata: doc.metadata
        }));

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
}