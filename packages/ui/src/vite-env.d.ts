/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'preact' {
  export * from 'preact';
}

declare module 'preact/hooks' {
  export * from 'preact/hooks';
}
