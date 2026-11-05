/** Permissive international rule: optional +, 6-15 digits, common separators allowed. Keep in sync with the frontend. */
export const PHONE_REGEX = /^\+?\d{6,15}$/;

export function normalizePhone(raw: string): string {
  let value = raw.replace(/[\s\-().]/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  return value;
}

export const isValidPhone = (raw: string) => PHONE_REGEX.test(normalizePhone(raw));