export const TUKANG_MAX_JUMLAH_ANAK = 3;

export type TukangMaritalFormValue = {
  sudahMenikah: boolean | '';
  jumlahAnak: number | '';
};

export const initialTukangMaritalForm = (): TukangMaritalFormValue => ({
  sudahMenikah: '',
  jumlahAnak: '',
});

export function tukangMaritalFromData(
  sudahMenikah: boolean | null | undefined,
  jumlahAnak: number | null | undefined,
): TukangMaritalFormValue {
  if (sudahMenikah === null || sudahMenikah === undefined) {
    return initialTukangMaritalForm();
  }
  return {
    sudahMenikah,
    jumlahAnak: sudahMenikah ? (jumlahAnak ?? '') : 0,
  };
}

export function formatTukangStatusPernikahan(
  sudahMenikah: boolean | null | undefined,
  jumlahAnak: number | null | undefined,
): string {
  if (sudahMenikah === null || sudahMenikah === undefined) return '—';
  if (!sudahMenikah) return 'Belum menikah';
  const anak = jumlahAnak ?? 0;
  return `Menikah (${anak} anak)`;
}

export function formatTukangPtkpStatus(
  sudahMenikah: boolean | null | undefined,
  jumlahAnak: number | null | undefined,
): string | null {
  if (sudahMenikah === null || sudahMenikah === undefined) return null;
  if (!sudahMenikah) return 'TK/0';
  const anak = Math.min(Math.max(0, jumlahAnak ?? 0), TUKANG_MAX_JUMLAH_ANAK);
  return `K/${anak}`;
}

export function validateTukangMaritalForm(
  marital: TukangMaritalFormValue,
): Partial<Record<'sudahMenikah' | 'jumlahAnak', string>> {
  const errors: Partial<Record<'sudahMenikah' | 'jumlahAnak', string>> = {};
  if (marital.sudahMenikah === '') {
    errors.sudahMenikah = 'Status pernikahan wajib dipilih';
    return errors;
  }
  if (marital.sudahMenikah) {
    if (marital.jumlahAnak === '') {
      errors.jumlahAnak = 'Jumlah anak wajib diisi';
    } else if (
      !Number.isInteger(marital.jumlahAnak) ||
      marital.jumlahAnak < 0 ||
      marital.jumlahAnak > TUKANG_MAX_JUMLAH_ANAK
    ) {
      errors.jumlahAnak = `Jumlah anak harus 0–${TUKANG_MAX_JUMLAH_ANAK}`;
    }
  }
  return errors;
}

export function tukangMaritalToPayload(marital: TukangMaritalFormValue): {
  sudahMenikah: boolean;
  jumlahAnak: number;
} {
  const sudahMenikah = marital.sudahMenikah === true;
  return {
    sudahMenikah,
    jumlahAnak: sudahMenikah ? Number(marital.jumlahAnak) : 0,
  };
}
