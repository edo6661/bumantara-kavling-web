import type { TahapanProyekData } from '../services/progressProyek.service';

export const TOTAL_TAHAPAN_PROYEK = 9;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getLatestTahapanPersentaseByName = (
  tahapan: TahapanProyekData[],
): Map<string, number> => {
  const sorted = [...tahapan].sort((a, b) => {
    const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b.id || 0) - (a.id || 0);
  });

  const unique = new Map<string, number>();
  for (const item of sorted) {
    if (!unique.has(item.namaTahapan)) {
      unique.set(item.namaTahapan, Number(item.persentase));
    }
  }
  return unique;
};

export const calculateTotalProgressFromTahapan = (
  tahapan: TahapanProyekData[],
): number => {
  const unique = getLatestTahapanPersentaseByName(tahapan);
  const totalSum = Array.from(unique.values()).reduce((acc, val) => acc + val, 0);
  const rataRata = totalSum / TOTAL_TAHAPAN_PROYEK;
  return clampPercent(Number(rataRata.toFixed(2)));
};

export const getEffectiveTotalProgress = (input: {
  persentase: number;
  persentaseIsOverride?: boolean;
  tahapan?: TahapanProyekData[];
}): number => {
  const stored = clampPercent(Number(input.persentase ?? 0));
  const isOverride = input.persentaseIsOverride ?? false;

  if (!isOverride && stored === 0 && input.tahapan?.length) {
    return calculateTotalProgressFromTahapan(input.tahapan);
  }

  return stored;
};
