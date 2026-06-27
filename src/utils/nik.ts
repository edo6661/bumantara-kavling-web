export const NIK_LENGTH = 16;
/** Batas panjang kolom NIK di database / API. */
export const NIK_INPUT_MAX = 20;

export function normalizeNikDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Input tukang baru: angka saja, maks 16 digit (standar Coretax). */
export function sanitizeNikInput(value: string): string {
  return normalizeNikDigits(value).slice(0, NIK_LENGTH);
}

/** Input upah SPK: angka saja, tanpa memotong ke 16 — agar data prod lama tetap utuh. */
export function normalizeNikInput(value: string): string {
  return normalizeNikDigits(value).slice(0, NIK_INPUT_MAX);
}

export function isValidNik(value: string): boolean {
  return normalizeNikDigits(value).length === NIK_LENGTH;
}

export function getNikValidationError(value: string, label = 'NIK'): string | null {
  const digits = normalizeNikDigits(value);
  if (!digits) return `${label} wajib diisi`;
  if (digits.length !== NIK_LENGTH) {
    return `${label} harus tepat ${NIK_LENGTH} digit (saat ini ${digits.length} digit)`;
  }
  return null;
}
