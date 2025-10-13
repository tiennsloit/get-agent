import * as vscode from "vscode";
import {
  PromptMessage,
  SystemPromptMessage,
  UserPromptMessage,
} from "../core/types/promptMessage";
import { StreamResponseChunk } from "../core/types/chatChunk";
import { configState } from "../managers/state/configState";
import { DiContainer } from "../core/di-container";
import { INJECTION_KEYS } from "../core/constants/injectionKeys";

export class LocalAIClient {
  private static instance: LocalAIClient;
  private modelInstances: Map<string, {
    model: any;
    llama: any;
    status: "initializing" | "ready",
    lastUsedAt: Date
  }> = new Map();
  private isCompletionRunning: boolean; // Track if completion is in progress
  public abortController: AbortController | null = null;

  /**
   * Private constructor that initializes the LocalAIClient instance.
   * Initializes a Map to store model instances and a boolean to track if completion is in progress.
   * Starts a timer to remove model instances that have not been used in the last 30 seconds.
   * @private
   */
  private constructor() {
    // Reset data
    this.modelInstances = new Map();
    this.isCompletionRunning = false;

    // Start a timer to remove inactive model instances
    setInterval(() => {
      const now = new Date();
      this.modelInstances.forEach(({ lastUsedAt }, modelName) => {
        if ((now.getTime() - lastUsedAt.getTime()) > 30000) {
          this.modelInstances.delete(modelName);
          console.log(`Removed model ${modelName} due to inactivity.`);
        }
      });
    }, 30000);
  }

  /**
   * Returns the singleton instance of LocalAIClient. If the instance does not
   * exist, it initializes a new instance.
   * @returns {LocalAIClient} The singleton instance of LocalAIClient
   */
  public static getInstance(): LocalAIClient {
    if (!LocalAIClient.instance) {
      LocalAIClient.instance = new LocalAIClient();
    }
    return LocalAIClient.instance;
  }

  /**
   * Initializes a model instance.
   * If the model is already initialized, the method will return the existing model instance.
   * If the model is being initialized, the method will wait until the initialization is finished.
   * If the model is not initialized, the method will load it from file and initialize it.
   * @param {string} modelName - The name of the model to initialize
   * @returns {Promise<{ model: any, llama: any }>} - A promise that resolves with the model instance
   */
  async initModel(modelName: string): Promise<{ model: any, llama: any }> {
    if (this.modelInstances.has(modelName) && this.modelInstances.get(modelName)!.status === "ready") {
      // If model is already initialized, update lastUsedAt
      this.modelInstances.set(modelName, { ...this.modelInstances.get(modelName)!, lastUsedAt: new Date() });
      return this.modelInstances.get(modelName)!;
    } else if (this.modelInstances.has(modelName) && this.modelInstances.get(modelName)!.status === "initializing") {
      // If model is being initialized, wait 1s and call recursively
      while (this.modelInstances.get(modelName)!.status === "initializing") {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return await this.initModel(modelName);
    }

    // If model is not initialized, load it from file
    const context = DiContainer.get<vscode.ExtensionContext>(INJECTION_KEYS.CONTEXT);
    const selectedModel = configState.llmModels.find(item => item.id === modelName)!;
    const modelFileUri = vscode.Uri.joinPath(context.globalStorageUri, 'models', selectedModel.fileName);
    const modelPath = modelFileUri.fsPath;
    const { getLlama } = await import("node-llama-cpp");
    const lastUsedAt = new Date();
    this.modelInstances.set(modelName, { status: "initializing", lastUsedAt, llama: null, model: null });
    const llama = await getLlama();
    const model = await llama.loadModel({ modelPath, contextSize: 4096 });
    this.modelInstances.set(modelName, { model, llama, lastUsedAt, status: 'ready' });

    return { llama, model };
  }

  /**
   * Generate a completion based on a system and user prompt, and possibly a schema
   * @param modelName The model to use for generating the completion
   * @param systemPrompt The system prompt to use for generating the completion
   * @param userPrompt The user prompt to use for generating the completion (optional)
   * @param schema The schema to use for generating the completion (optional)
   * @param maxTokens The maximum number of tokens to generate for the completion (optional)
   * @returns A promise that resolves with the generated completion, or null if the completion is skipped
   */
  async completion(modelName: string, {
    systemPrompt,
    userPrompt,
    schema,
    maxTokens,
  }: {
    systemPrompt: SystemPromptMessage;
    userPrompt?: UserPromptMessage;
    schema?: any;
    maxTokens?: number;
  }): Promise<string | null> {
    // If a completion is already running, skip this one
    if (this.isCompletionRunning) {
      console.log("Completion skipped - another completion is already running");
      return null;
    }

    this.isCompletionRunning = true; // Mark as running
    try {
      const { LlamaChatSession } = await import("node-llama-cpp");
      const { model, llama } = await this.initModel(modelName);
      const context = await model.createContext();
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
        systemPrompt: systemPrompt.content,
      });

      let grammar;
      if (schema) {
        grammar = await llama.createGrammarForJsonSchema(schema);
      }

      // Setup abort controller
      this.abortController = new AbortController();

      // Generating response
      const res = await session.prompt(
        userPrompt?.content || "Generate response",
        {
          grammar,
          maxTokens: maxTokens ?? 1024,
          stopOnAbortSignal: true,
          signal: this.abortController.signal,
        }
      );

      this.abortController = null;
      context.dispose();
      return res;
    } catch (e) {
      throw e;
    } finally {
      this.isCompletionRunning = false; // Reset flag when done
    }
  }

  /**
   * Stream chat completion using the local model
   * @param modelName The name of the model to use for the completion
   * @param chatHistory The chat history to use as context for the completion
   * @param prompt The user input to generate a response for
   * @param onEvent The callback function to call with each chunk of the response
   * @returns A promise that resolves when the completion is finished
   */
  async streamChatCompletion(
    modelName: string,
    chatHistory: Array<PromptMessage>,
    prompt: string,
    onEvent: (event: StreamResponseChunk) => void
  ): Promise<void> {

    const { LlamaChatSession } = await import("node-llama-cpp");
    let messageId: string = `local-message-id-${new Date().toISOString()}`;
    try {
      // Count tokens and time
      let tokenCount = 0;
      const startTime = Date.now();
      const { model } = await this.initModel(modelName);
      const context = await model.createContext();
      const session = new LlamaChatSession({
        contextSequence: context.getSequence(),
      });
      session.setChatHistory(
        chatHistory.map((e) => {
          if (e.role === "assistant") {
            return {
              type: "model",
              response: [e.content],
            };
          }
          return {
            type: e.role,
            text: e.content,
          };
        })
      );

      // Setup abort controller
      this.abortController = new AbortController();

      // Start stream
      await session.prompt(prompt, {
        maxTokens: 4096,
        stopOnAbortSignal: true,
        signal: this.abortController.signal,
        onTextChunk(content: string) {
          // Send chunk data to webview
          onEvent({ messageId, content });

          // Count token
          tokenCount += 1;
        },
      });

      // End stream
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      onEvent({
        messageId,
        endStreamData: {
          type: "stop",
          tokenCount,
          totalTime,
        },
      });

      // Reset context & abort controller
      context.dispose();
      this.abortController = null;
    } catch (error) {
      console.error("Streaming error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onEvent({
        messageId,
        endStreamData: {
          type: "error",
          errorMessage,
          tokenCount: 0,
          totalTime: 0,
        },
      });
    }
  }

  /**
   * Stops the current stream by aborting the associated AbortController.
   * If an AbortController exists, it will be aborted, effectively signaling
   * that the stream operation should be terminated.
   */
  public stopStream() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
