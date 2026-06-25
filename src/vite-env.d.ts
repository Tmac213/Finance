/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  // more env variables can be defined by this
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
