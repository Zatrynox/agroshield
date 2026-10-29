const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const shortDateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export function formatDate(value: string | Date): string {
  return dateFormat.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatShortDate(value: string | Date): string {
  return shortDateFormat.format(typeof value === 'string' ? new Date(value) : value);
}

export function formatArea(hectares: number): string {
  return `${formatNumber(hectares)} ha`;
}

export interface Countdown {
  text: string;
  overdue: boolean;
  urgent: boolean;
  milliseconds: number;
}

export function countdown(deadlineAt: string, now: Date): Countdown {
  const milliseconds = new Date(deadlineAt).getTime() - now.getTime();
  const absolute = Math.abs(milliseconds);
  const minutes = Math.round(absolute / 60_000);
  const hours = Math.floor(minutes / 60);

  let amount: string;
  if (minutes < 60) {
    amount = `${minutes} min`;
  } else if (hours < 48) {
    amount = `${hours} h`;
  } else {
    amount = `${Math.floor(hours / 24)} d`;
  }

  return {
    text: milliseconds >= 0 ? `Vence en ${amount}` : `Vencida hace ${amount}`,
    overdue: milliseconds < 0,
    urgent: milliseconds >= 0 && milliseconds <= 24 * 3_600_000,
    milliseconds,
  };
}

export function titleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
