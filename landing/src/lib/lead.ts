export interface LeadValues {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  consent: boolean;
  website: string;
}

export type LeadField = 'name' | 'email' | 'company' | 'phone' | 'message' | 'consent';
export type LeadErrors = Partial<Record<LeadField, string>>;

export interface LeadPayload {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  consent: true;
  website: string;
  captchaChallenge: string;
  captchaSolution: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringField(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export function readLeadForm(form: HTMLFormElement): LeadValues {
  const data = new FormData(form);
  return {
    name: stringField(data, 'name'),
    email: stringField(data, 'email'),
    company: stringField(data, 'company'),
    phone: stringField(data, 'phone'),
    message: stringField(data, 'message'),
    consent: data.get('consent') !== null,
    website: stringField(data, 'website'),
  };
}

export function validateLead(values: LeadValues): LeadErrors {
  const errors: LeadErrors = {};

  if (values.name.length < 2) errors.name = 'Escribe al menos 2 caracteres.';
  if (values.name.length > 120) errors.name = 'El nombre no puede superar 120 caracteres.';

  if (!emailPattern.test(values.email)) {
    errors.email = 'Escribe un correo válido, por ejemplo nombre@empresa.es.';
  } else if (values.email.length > 320) {
    errors.email = 'El correo es demasiado largo.';
  }

  if (values.company.length < 2) {
    errors.company = 'Escribe el nombre de la empresa o entidad.';
  } else if (values.company.length > 160) {
    errors.company = 'El nombre no puede superar 160 caracteres.';
  }

  if (values.phone.length > 40) errors.phone = 'El teléfono no puede superar 40 caracteres.';

  if (values.message.length < 10) {
    errors.message = 'Cuéntanos algo más: cultivo, superficie o sensores.';
  } else if (values.message.length > 2000) {
    errors.message = 'El mensaje no puede superar 2000 caracteres.';
  }

  if (!values.consent) {
    errors.consent = 'Necesitamos tu consentimiento para responder a la solicitud.';
  }

  return errors;
}

export function toLeadPayload(
  values: LeadValues,
  captchaChallenge: string,
  captchaSolution: string,
): LeadPayload {
  return {
    name: values.name,
    email: values.email,
    company: values.company,
    phone: values.phone,
    message: values.message,
    consent: true,
    website: values.website,
    captchaChallenge,
    captchaSolution,
  };
}

export function problemDetail(input: unknown, fallback: string): string {
  if (typeof input === 'object' && input !== null) {
    const detail = (input as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim().length > 0) return detail;
    const title = (input as { title?: unknown }).title;
    if (typeof title === 'string' && title.trim().length > 0) return title;
  }
  return fallback;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function safeReference(input: string | null | undefined): string {
  if (!input) return '';
  return uuidPattern.test(input.trim()) ? input.trim().toLowerCase() : '';
}

export function shortReference(reference: string): string {
  return reference ? reference.slice(0, 8).toUpperCase() : '';
}
