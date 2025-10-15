import * as vscode from 'vscode';

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
 * Request context for interceptors
 */
export interface RequestContext {
  /** HTTP method */
  method: string;
  /** Request URL (without base URL) */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT) */
  body?: any;
  /** Timestamp when request started */
  timestamp: number;
}

/**
 * Response context for interceptors
 */
export interface ResponseContext extends RequestContext {
  /** Response status code */
  statusCode?: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether request succeeded */
  success: boolean;
  /** Error if request failed */
  error?: Error;
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
  /** Enable request logging */
  enableLogging?: boolean;
}

/**
 * Generic HTTP client for API requests
 */
export class ApiClient {
  private client: any = null;
  private config: ApiClientConfig;
  private initPromise: Promise<void>;
  private requestInterceptors: Array<(context: RequestContext) => void | Promise<void>> = [];
  private responseInterceptors: Array<(context: ResponseContext) => void | Promise<void>> = [];

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = this.loadConfiguration(config);
    this.initPromise = this.initializeClient();
    
    // Add default logging interceptor if enabled
    if (this.config.enableLogging !== false) {
      this.addRequestInterceptor(this.logRequest.bind(this));
      this.addResponseInterceptor(this.logResponse.bind(this));
    }
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
      retryLimit: override?.retryLimit || config.get<number>('retryLimit', 2),
      enableLogging: override?.enableLogging ?? config.get<boolean>('enableLogging', true)
    };
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: (context: RequestContext) => void | Promise<void>): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: (context: ResponseContext) => void | Promise<void>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   */
  private async executeRequestInterceptors(context: RequestContext): Promise<void> {
    for (const interceptor of this.requestInterceptors) {
      await interceptor(context);
    }
  }

  /**
   * Execute response interceptors
   */
  private async executeResponseInterceptors(context: ResponseContext): Promise<void> {
    for (const interceptor of this.responseInterceptors) {
      await interceptor(context);
    }
  }

  /**
   * Default request logger
   */
  private logRequest(context: RequestContext): void {
    console.log(`[API Request] ${context.method} ${this.config.baseUrl}/${context.url}`, {
      timestamp: new Date(context.timestamp).toISOString(),
      headers: context.headers,
      body: context.body
    });
  }

  /**
   * Default response logger
   */
  private logResponse(context: ResponseContext): void {
    const logLevel = context.success ? 'log' : 'error';
    const status = context.success ? 'SUCCESS' : 'FAILED';
    
    console[logLevel](`[API Response] ${status} ${context.method} ${this.config.baseUrl}/${context.url}`, {
      statusCode: context.statusCode,
      duration: `${context.duration}ms`,
      timestamp: new Date(context.timestamp).toISOString(),
      error: context.error?.message
    });
  }

  /**
   * Perform GET request
   */
  public async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const startTime = Date.now();
    const requestContext: RequestContext = {
      method: 'GET',
      url,
      headers: options?.headers,
      timestamp: startTime
    };

    await this.executeRequestInterceptors(requestContext);

    try {
      const client = await this.ensureInitialized();
      const response = await client.get(url, this.buildOptions(options));
      const result = JSON.parse(response.body) as T;

      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: response.statusCode,
        duration: Date.now() - startTime,
        success: true
      });

      return result;
    } catch (error) {
      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: (error as any)?.response?.statusCode,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform POST request
   */
  public async post<T>(url: string, body: any, options?: RequestOptions): Promise<T> {
    const startTime = Date.now();
    const requestContext: RequestContext = {
      method: 'POST',
      url,
      headers: options?.headers,
      body,
      timestamp: startTime
    };

    await this.executeRequestInterceptors(requestContext);

    try {
      const client = await this.ensureInitialized();
      const response = await client.post(url, {
        ...this.buildOptions(options),
        json: body
      });
      const result = JSON.parse(response.body) as T;

      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: response.statusCode,
        duration: Date.now() - startTime,
        success: true
      });

      return result;
    } catch (error) {
      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: (error as any)?.response?.statusCode,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform PUT request
   */
  public async put<T>(url: string, body: any, options?: RequestOptions): Promise<T> {
    const startTime = Date.now();
    const requestContext: RequestContext = {
      method: 'PUT',
      url,
      headers: options?.headers,
      body,
      timestamp: startTime
    };

    await this.executeRequestInterceptors(requestContext);

    try {
      const client = await this.ensureInitialized();
      const response = await client.put(url, {
        ...this.buildOptions(options),
        json: body
      });
      const result = JSON.parse(response.body) as T;

      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: response.statusCode,
        duration: Date.now() - startTime,
        success: true
      });

      return result;
    } catch (error) {
      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: (error as any)?.response?.statusCode,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw this.handleError(error);
    }
  }

  /**
   * Perform DELETE request
   */
  public async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const startTime = Date.now();
    const requestContext: RequestContext = {
      method: 'DELETE',
      url,
      headers: options?.headers,
      timestamp: startTime
    };

    await this.executeRequestInterceptors(requestContext);

    try {
      const client = await this.ensureInitialized();
      const response = await client.delete(url, this.buildOptions(options));
      const result = JSON.parse(response.body) as T;

      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: response.statusCode,
        duration: Date.now() - startTime,
        success: true
      });

      return result;
    } catch (error) {
      await this.executeResponseInterceptors({
        ...requestContext,
        statusCode: (error as any)?.response?.statusCode,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
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
