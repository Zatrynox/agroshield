export const landingUrl = (import.meta.env.VITE_LANDING_URL ?? 'http://localhost:4321').replace(
  /\/+$/,
  '',
);

export const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL ?? 'hola@agroshield.example';

export const appEnv = import.meta.env.VITE_APP_ENV ?? 'development';
