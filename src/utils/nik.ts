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

export function getNikValidationError(
  value: string,
  label = 'NIK',
  options?: { unchangedFrom?: string },
): string | null {
  if (options?.unchangedFrom !== undefined && value.trim() === options.unchangedFrom.trim()) {
    return null;
  }
  const digits = normalizeNikDigits(value);
  if (!digits) return `${label} wajib diisi`;
  if (digits.length !== NIK_LENGTH) {
    return `${label} harus tepat ${NIK_LENGTH} digit angka`;
  }
  return null;
}

/** Validasi NIK opsional: kosong diperbolehkan, jika diisi harus 16 digit angka. */
export function getOptionalNikValidationError(
  value: string,
  label = 'NIK',
  options?: { unchangedFrom?: string },
): string | null {
  if (options?.unchangedFrom !== undefined && value.trim() === options.unchangedFrom.trim()) {
    return null;
  }
  const digits = normalizeNikDigits(value);
  if (!digits) return null;
  if (digits.length !== NIK_LENGTH) {
    return `${label} harus tepat ${NIK_LENGTH} digit angka`;
  }
  return null;
}

export function isNikValueUnchanged(value: string, original: string): boolean {
  return value.trim() === original.trim();
}

type NikRecord = { id?: number; nik?: string | null; nikKtp?: string | null };

function isPlaceholderNikValue(nik: string, prefixes?: readonly string[]): boolean {
  if (!prefixes?.length) return false;
  const normalized = nik.trim().toUpperCase();
  return prefixes.some((prefix) => normalized.startsWith(prefix.toUpperCase()));
}

/** Cek duplikat NIK berdasarkan digit (abaikan record dengan id yang dikecualikan). */
export function isNikDuplicate(
  value: string,
  records: NikRecord[],
  options?: {
    excludeId?: number;
    field?: 'nik' | 'nikKtp';
    ignorePlaceholderPrefixes?: readonly string[];
    unchangedFrom?: string;
  },
): boolean {
  const digits = normalizeNikDigits(value);
  if (!digits) return false;
  if (options?.unchangedFrom !== undefined && value.trim() === options.unchangedFrom.trim()) {
    return false;
  }

  const field = options?.field ?? 'nik';
  return records.some((record) => {
    if (options?.excludeId != null && record.id === options.excludeId) return false;
    const raw = (field === 'nik' ? record.nik : record.nikKtp) ?? '';
    if (isPlaceholderNikValue(raw, options?.ignorePlaceholderPrefixes)) return false;
    return normalizeNikDigits(raw) === digits;
  });
}

/** Cek duplikat NIK di dalam daftar baris form (mis. beberapa tukang dalam satu pengajuan). */
export function hasDuplicateNikInList(values: string[]): boolean {
  const seen = new Set<string>();
  for (const value of values) {
    const digits = normalizeNikDigits(value);
    if (!digits) continue;
    if (seen.has(digits)) return true;
    seen.add(digits);
  }
  return false;
}
