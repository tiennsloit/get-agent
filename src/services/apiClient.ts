import * as vscode from 'vscode';

// Type definitions for options
interface TimeoutOptions {
  request?: number;
}

interface RetryConfig {
  limit?: number;
  methods?: string[];
  statusCodes?: number[];
}

/**
 * Configuration options for API requests
 */
export interface RequestOptions {
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryOptions;
  /** URL query parameters */
  searchParams?: Record<string, string>;
}

/**
 * Retry configuration for failed requests
 */
export interface RetryOptions {
  /** Maximum retry attempts */
  limit?: number;
  /** HTTP methods to retry */
  methods?: string[];
  /** Status codes that trigger retry */
  statusCodes?: number[];
}

/**
 * Structured error response from API client
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Configuration interface for API client
 */
export interface ApiClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default timeout in milliseconds */
  timeout: number;
  /** Default retry limit */
  retryLimit: number;
}

/**
 * Generic HTTP client for API requests
 */
export class ApiClient {
  private client: any = null;
  private config: ApiClientConfig;
  private initPromise: Promise<void>;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = this.loadConfiguration(config);
    this.initPromise = this.initializeClient();
  }

  /**
   * Initialize the got client with dynamic import
   */
  private async initializeClient(): Promise<void> {
    const { default: got } = await import('got');
    this.client = got.extend({
      prefixUrl: this.config.baseUrl,
      timeout: {
        request: this.config.timeout
      },
      retry: {
        limit: this.config.retryLimit,
        methods: ['GET', 'PUT', 'DELETE'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504]
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VSCode-GoNext-Extension'
      }
    });
  }

  /**
   * Ensure client is initialized before making requests
   */
  private async ensureInitialized(): Promise<any> {
    await this.initPromise;
    if (!this.client) {
      throw new Error('HTTP client not initialized');
    }
    return this.client;
  }

  /**
   * Load configuration from VS Code settings with fallback to defaults
   */
  private loadConfiguration(override?: Partial<ApiClientConfig>): ApiClientConfig {
    const config = vscode.workspace.getConfiguration('gonext.api');
    
    return {
      baseUrl: override?.baseUrl || config.get<string>('baseUrl', 'https://gonext.hien.one/api'),
      timeout: override?.timeout || config.get<number>('timeout', 30000),
      retryLimit: override?.retryLimit || config.get<number>('retryLimit', 2)
    };
  }

  /**
   * Perform GET request
   */
  public async get<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const client = await this.ensureInitialized();
      const response = await client.get(url, this.buildOptions(options));
      return JSON.parse(response.body) as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform POST request
   */
  public async post<T>(url: string, body: any, options?: RequestOptions): Promise<T> {
    try {
      const client = await this.ensureInitialized();
      const response = await client.post(url, {
        ...this.buildOptions(options),
        json: body
      });
      return JSON.parse(response.body) as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform PUT request
   */
  public async put<T>(url: string, body: any, options?: RequestOptions): Promise<T> {
    try {
      const client = await this.ensureInitialized();
      const response = await client.put(url, {
        ...this.buildOptions(options),
        json: body
      });
      return JSON.parse(response.body) as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform DELETE request
   */
  public async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const client = await this.ensureInitialized();
      const response = await client.delete(url, this.buildOptions(options));
      return JSON.parse(response.body) as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build request options from RequestOptions interface
   */
  private buildOptions(options?: RequestOptions): Record<string, any> {
    const opts: Record<string, any> = {};

    if (options?.headers) {
      opts.headers = options.headers;
    }

    if (options?.timeout) {
      opts.timeout = { request: options.timeout };
    }

    if (options?.retry) {
      opts.retry = {
        limit: options.retry.limit ?? this.config.retryLimit,
        methods: options.retry.methods,
        statusCodes: options.retry.statusCodes
      };
    }

    if (options?.searchParams) {
      opts.searchParams = options.searchParams;
    }

    return opts;
  }

  /**
   * Handle and transform errors into ApiError
   */
  private handleError(error: unknown): ApiError {
    // Check if error has response property (RequestError)
    if (error && typeof error === 'object' && 'code' in error) {
      const requestError = error as any;
      
      // Network or timeout error
      if (requestError.code === 'ETIMEDOUT') {
        return new ApiError(
          'Request timeout - the API did not respond in time',
          undefined,
          requestError instanceof Error ? requestError : undefined
        );
      }

      // HTTP error with response
      if ('response' in requestError && requestError.response) {
        const statusCode = requestError.response.statusCode;
        let message = `API request failed with status ${statusCode}`;

        // Try to parse error message from response body
        try {
          const body = JSON.parse(requestError.response.body as string);
          if (body.message) {
            message = body.message;
          } else if (body.error) {
            message = body.error;
          }
        } catch {
          // Use default message if body parsing fails
        }

        return new ApiError(message, statusCode, requestError instanceof Error ? requestError : undefined);
      }

      // Network error without response
      return new ApiError(
        `Network error: ${requestError.message}`,
        undefined,
        requestError instanceof Error ? requestError : undefined
      );
    }

    // Unknown error type
    if (error instanceof Error) {
      return new ApiError(error.message, undefined, error);
    }

    return new ApiError('An unknown error occurred', undefined);
  }

  /**
   * Update configuration dynamically
   */
  public async updateConfig(config: Partial<ApiClientConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.initializeClient();
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ApiClientConfig> {
    return { ...this.config };
  }
}
