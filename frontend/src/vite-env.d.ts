/// <reference types="vite/client" />

// Environment variables used by the app (set them in frontend/.env or on the host).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
