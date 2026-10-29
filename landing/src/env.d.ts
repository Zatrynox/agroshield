/// <reference types="astro/client" />

declare module '*?worker' {
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}

interface ImportMetaEnv {
  readonly PUBLIC_SITE_NAME?: string;
  readonly PUBLIC_LANDING_URL?: string;
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_SUPPORT_EMAIL?: string;
  readonly PUBLIC_DEMO_MODE?: string;
  readonly PUBLIC_LEGAL_ENTITY?: string;
  readonly PUBLIC_LEGAL_ADDRESS?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_ANALYTICS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
