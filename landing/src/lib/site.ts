const cleanUrl = (value: string | undefined, fallback: string): string => {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  return candidate.replace(/\/+$/, '');
};

const env = import.meta.env;

export const siteName = env.PUBLIC_SITE_NAME?.trim() || 'AgroShield';
export const landingUrl = cleanUrl(env.PUBLIC_LANDING_URL, 'http://localhost:4321');
export const appUrl = cleanUrl(env.PUBLIC_APP_URL, 'http://localhost:5173');
export const supportEmail = env.PUBLIC_SUPPORT_EMAIL?.trim() || '';
export const legalEntity =
  env.PUBLIC_LEGAL_ENTITY?.trim() || 'AgroShield, proyecto en desarrollo';
export const legalAddress = env.PUBLIC_LEGAL_ADDRESS?.trim() || '';
export const demoMode = env.PUBLIC_DEMO_MODE === 'true';
export const currentYear = new Date().getFullYear();

const placeholderEmail = /(^|@)(example\.(com|org|net)|agroshield\.example)$/i;
const placeholderPhone = /^(34)?600000000$|^\+?0+$/;

export const hasRealEmail = Boolean(supportEmail) && !placeholderEmail.test(supportEmail);

const whatsappDigits = (env.PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
export const hasRealWhatsApp =
  whatsappDigits.length >= 8 && !placeholderPhone.test(whatsappDigits);

export const whatsappUrl = hasRealWhatsApp
  ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
      'Hola, me gustaría saber más sobre AgroShield.',
    )}`
  : '';

export const contactHref = hasRealEmail ? `mailto:${supportEmail}` : '/demo';
