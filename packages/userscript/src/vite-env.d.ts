/// <reference types="vite/client" />

declare global {
  // Tampermonkey/Greasemonkey global types
  const GM_getValue: <T>(key: string, defaultValue?: T) => T;
  const GM_setValue: <T>(key: string, value: T) => void;
  const GM_xmlhttpRequest: unknown;
  const unsafeWindow: Window & typeof globalThis;
}

export {};
