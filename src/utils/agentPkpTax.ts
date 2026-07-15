/** PPN untuk agent perusahaan PKP — closing fee disimpan bruto (termasuk PPN) */
export const PPN_PKP_RATE = 0.11;

/** Ambil DPP closing dari nominal bruto jika PKP; non-PKP pakai nominal apa adanya */
export function extractClosingDpp(
  grossNominal: number,
  isPkp: boolean,
): number {
  if (!isPkp || grossNominal <= 0) return grossNominal;
  return Math.round(grossNominal / (1 + PPN_PKP_RATE));
}

/** Bagian PPN closing (bruto − DPP). Non-PKP = 0 */
export function extractClosingPpn(
  grossNominal: number,
  isPkp: boolean,
): number {
  if (!isPkp || grossNominal <= 0) return 0;
  return Math.max(0, grossNominal - extractClosingDpp(grossNominal, true));
}
