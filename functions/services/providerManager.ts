interface AIProvider {
  init(): Promise<void>;
  request(prompt: string, options?: RequestOptions): Promise<AIResponse>;
  stream(prompt: string, options?: RequestOptions): Promise<ReadableStream>;
  close(): Promise<void>;
}

interface RequestOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface AIResponse {
  text: string;
  done: boolean;
}

/**
 * Ollama Provider Implementation
 */
class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async init(): Promise<void> {
    // No initialization needed
  }

  async request(prompt: string, options?: RequestOptions): Promise<AIResponse> {
    const requestBody = {
      model: this.model,
      prompt,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.response;

    if (!content) {
      throw new Error("No content in Ollama response");
    }

    return {
      text: content,
      done: data.done ?? true,
    };
  }

  async stream(prompt: string, options?: RequestOptions): Promise<ReadableStream> {
    const requestBody = {
      model: this.model,
      prompt,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama stream request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    return response.body;
  }

  async close(): Promise<void> {
    // No cleanup needed for fetch
  }
}

/**
 * Groq Provider Implementation (OpenAI-compatible)
 */
class GroqProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async init(): Promise<void> {
    // No initialization needed
  }

  async request(prompt: string, options?: RequestOptions): Promise<AIResponse> {
    const messages = [
      { role: "user", content: prompt },
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 8192,
      stream: false,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Groq request failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Groq response");
    }

    return {
      text: content,
      done: data.choices?.[0]?.finish_reason === "stop",
    };
  }

  async stream(prompt: string, options?: RequestOptions): Promise<ReadableStream> {
    const messages = [
      { role: "user", content: prompt },
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? 16384,
      stream: true,
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Groq stream request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    return response.body;
  }

  async close(): Promise<void> {
    // No cleanup needed for fetch
  }
}

/**
 * Deepseek Provider Implementation
 */
class DeepseekProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async init(): Promise<void> {
    // No initialization needed
  }

  async request(prompt: string, options?: RequestOptions): Promise<AIResponse> {
    const messages = [
      { role: "user", content: prompt },
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 8192,
      stream: false,
    };

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Deepseek request failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Deepseek response");
    }

    return {
      text: content,
      done: data.choices?.[0]?.finish_reason === "stop",
    };
  }

  async stream(prompt: string, options?: RequestOptions): Promise<ReadableStream> {
    const messages = [
      { role: "user", content: prompt },
    ];

    const requestBody = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? 16384,
      stream: true,
    };

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Deepseek stream request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    return response.body;
  }

  async close(): Promise<void> {
    // No cleanup needed for fetch
  }
}

/**
 * Provider Manager - handles automatic provider switching with fallback
 * Priority: Groq > Ollama > Deepseek
 */
export class ProviderManager {
  private static providers: AIProvider[] = [];
  private static initPromise: Promise<void> | null = null;

  /**
   * Initialize all available AI providers in priority order:
   * 1. Groq
   * 2. Ollama
   * 3. Deepseek
   */
  static async initialize(): Promise<void> {
    if (this.providers.length > 0) {
      return;
    }

    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      // Priority 1: Groq (highest priority)
      if (process.env.GROQ_API_KEY) {
        const model = process.env.GROQ_MODEL || "qwen/qwen3-32b";
        const provider = new GroqProvider(process.env.GROQ_API_KEY, model);
        await provider.init();
        this.providers.push(provider);
      }
      
      // Priority 2: Ollama
      if (process.env.OLLAMA_BASE_URL) {
        const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";
        const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL, model);
        await provider.init();
        this.providers.push(provider);
      }
      
      // Priority 3: Deepseek (fallback)
      if (process.env.DEEPSEEK_API_KEY) {
        const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
        const provider = new DeepseekProvider(process.env.DEEPSEEK_API_KEY, model);
        await provider.init();
        this.providers.push(provider);
      }

      if (this.providers.length === 0) {
        throw new Error(
          "No AI provider configured. Please set GROQ_API_KEY, OLLAMA_BASE_URL, or DEEPSEEK_API_KEY"
        );
      }

      console.log(`Initialized ${this.providers.length} AI provider(s)`);
    })();

    await this.initPromise;
  }

  /**
   * Make a request with automatic fallback to next provider on failure
   */
  static async request(prompt: string, options?: RequestOptions): Promise<AIResponse> {
    await this.initialize();

    const errors: Error[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = provider.constructor.name;
      
      try {
        console.log(`Trying ${providerName} (attempt ${i + 1}/${this.providers.length})...`);
        const response = await provider.request(prompt, options);
        console.log(`✓ ${providerName} succeeded`);
        return response;
      } catch (error) {
        const err = error as Error;
        console.error(`✗ ${providerName} failed:`, err.message);
        errors.push(new Error(`${providerName}: ${err.message}`));
        
        // Continue to next provider
        if (i < this.providers.length - 1) {
          console.log(`Falling back to next provider...`);
        }
      }
    }

    // All providers failed
    const errorMessages = errors.map(e => e.message).join('; ');
    throw new Error(`All AI providers failed: ${errorMessages}`);
  }

  /**
   * Stream a request with automatic fallback to next provider on failure
   */
  static async stream(prompt: string, options?: RequestOptions): Promise<ReadableStream> {
    await this.initialize();

    const errors: Error[] = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const providerName = provider.constructor.name;
      
      try {
        console.log(`Trying ${providerName} for streaming (attempt ${i + 1}/${this.providers.length})...`);
        const stream = await provider.stream(prompt, options);
        console.log(`✓ ${providerName} stream succeeded`);
        return stream;
      } catch (error) {
        const err = error as Error;
        console.error(`✗ ${providerName} stream failed:`, err.message);
        errors.push(new Error(`${providerName}: ${err.message}`));
        
        // Continue to next provider
        if (i < this.providers.length - 1) {
          console.log(`Falling back to next provider...`);
        }
      }
    }

    // All providers failed
    const errorMessages = errors.map(e => e.message).join('; ');
    throw new Error(`All AI providers failed for streaming: ${errorMessages}`);
  }

  /**
   * Cleanup resources
   */
  static async close(): Promise<void> {
    for (const provider of this.providers) {
      await provider.close();
    }
    this.providers = [];
    this.initPromise = null;
  }
}
