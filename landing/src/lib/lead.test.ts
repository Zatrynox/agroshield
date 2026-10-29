import { describe, expect, it } from 'vitest';
import {
  problemDetail,
  safeReference,
  shortReference,
  toLeadPayload,
  validateLead,
  type LeadValues,
} from './lead';

const valid: LeadValues = {
  name: 'Marta Ruiz',
  email: 'marta@fincaelvalle.es',
  company: 'Finca El Valle',
  phone: '+34 600 123 456',
  message: 'Supervisamos 40 hectáreas de olivar con cuatro zonas.',
  consent: true,
  website: '',
};

describe('validateLead', () => {
  it('accepts a complete request', () => {
    expect(validateLead(valid)).toEqual({});
  });

  it('reports missing and malformed fields', () => {
    const errors = validateLead({
      ...valid,
      name: 'M',
      email: 'marta-at-finca',
      company: '',
      phone: '1'.repeat(41),
      message: 'corto',
      consent: false,
    });

    expect(errors.name).toContain('2 caracteres');
    expect(errors.email).toContain('correo válido');
    expect(errors.company).toBeDefined();
    expect(errors.phone).toContain('40 caracteres');
    expect(errors.message).toContain('algo más');
    expect(errors.consent).toBeDefined();
  });

  it('rejects values above the server limits', () => {
    const errors = validateLead({
      ...valid,
      name: 'n'.repeat(121),
      email: `${'a'.repeat(310)}@empresa.es`,
      company: 'c'.repeat(161),
      message: 'm'.repeat(2001),
    });

    expect(errors.name).toContain('120');
    expect(errors.email).toContain('demasiado largo');
    expect(errors.company).toContain('160');
    expect(errors.message).toContain('2000');
  });
});

describe('toLeadPayload', () => {
  it('sends only the fields the API expects and keeps the honeypot', () => {
    const payload = toLeadPayload(valid, 'challenge.value', '1234');

    expect(payload).toEqual({
      name: valid.name,
      email: valid.email,
      company: valid.company,
      phone: valid.phone,
      message: valid.message,
      consent: true,
      website: '',
      captchaChallenge: 'challenge.value',
      captchaSolution: '1234',
    });
  });
});

describe('safeReference', () => {
  it('accepts a canonical UUID and normalizes it', () => {
    const id = 'C4F1B7A2-9D31-4F0E-8C55-1A2B3C4D5E6F';
    expect(safeReference(id)).toBe(id.toLowerCase());
  });

  it('rejects anything that is not a UUID', () => {
    expect(safeReference('')).toBe('');
    expect(safeReference(null)).toBe('');
    expect(safeReference('42')).toBe('');
    expect(safeReference('javascript:alert(1)')).toBe('');
    expect(safeReference('<script>alert(1)</script>')).toBe('');
  });
});

describe('shortReference', () => {
  it('uses the first eight characters in upper case', () => {
    expect(shortReference('c4f1b7a2-9d31-4f0e-8c55-1a2b3c4d5e6f')).toBe('C4F1B7A2');
    expect(shortReference('')).toBe('');
  });
});

describe('problemDetail', () => {
  it('prefers detail, then title, then the fallback', () => {
    expect(problemDetail({ detail: 'Solicitud duplicada' }, 'fallback')).toBe(
      'Solicitud duplicada',
    );
    expect(problemDetail({ detail: '  ', title: 'No válido' }, 'fallback')).toBe(
      'No válido',
    );
    expect(problemDetail({}, 'fallback')).toBe('fallback');
    expect(problemDetail(null, 'fallback')).toBe('fallback');
  });
});
