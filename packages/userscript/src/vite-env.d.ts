/// <reference types="vite/client" />

declare const GM_getValue: <T>(key: string, defaultValue?: T) => T;
declare const GM_setValue: <T>(key: string, value: T) => void;
declare const GM_xmlhttpRequest: any;
