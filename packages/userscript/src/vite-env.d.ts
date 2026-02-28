/// <reference types="vite/client" />

// Tampermonkey/Greasemonkey global types
declare const GM_getValue: <T>(key: string, defaultValue?: T) => T;
declare const GM_setValue: <T>(key: string, value: T) => void;
declare const GM_xmlhttpRequest: unknown;
declare const unsafeWindow: Window & typeof globalThis;

export {};
