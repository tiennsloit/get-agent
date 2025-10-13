/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.yaml' {
  const content: any;
  export default content;
}

declare module '*.yml' {
  const content: any;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_IS_MOCKED: string;
  // add more here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}