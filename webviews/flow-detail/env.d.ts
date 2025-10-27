/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// VS Code webview API types
declare module 'vscode-webview' {
  export interface WebviewApi<T> {
    postMessage(message: unknown): void;
    getState(): T | undefined;
    setState<T>(newState: T): T;
  }
}

declare function acquireVsCodeApi<T = unknown>(): import('vscode-webview').WebviewApi<T>;