export type SpkTerminPembayaranJenis = 'TERMIN_55' | 'TERMIN_100' | 'RETENSI';
export type SpkPembayaranJenis = SpkTerminPembayaranJenis | 'KASBON' | 'UPAH';
export type SpkPembayaranStatus = 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR' | 'DRAFT';
export type SpkKasbonTargetTermin = 'TERMIN_55' | 'TERMIN_100';

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: 'Termin 55% (50% kontrak)',
  TERMIN_100: 'Termin 100% (45% kontrak)',
  RETENSI: 'Retensi (5% kontrak)',
  KASBON: 'Kasbon',
  UPAH: 'Upah tukang',
};

export const SPK_KASBON_TARGET_LABEL: Record<SpkKasbonTargetTermin, string> = {
  TERMIN_55: 'Termin 55%',
  TERMIN_100: 'Termin 100%',
};

export const JENIS_UI_COLOR: Record<
  SpkPembayaranJenis,
  { badge: string; row: string; text: string }
> = {
  TERMIN_55: {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    row: 'bg-indigo-50/60',
    text: 'text-indigo-700',
  },
  TERMIN_100: {
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    row: 'bg-violet-50/60',
    text: 'text-violet-700',
  },
  RETENSI: {
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    row: 'bg-amber-50/60',
    text: 'text-amber-800',
  },
  KASBON: {
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
    row: 'bg-orange-50/60',
    text: 'text-orange-800',
  },
  UPAH: {
    badge: 'bg-teal-100 text-teal-900 border-teal-200',
    row: 'bg-teal-50/60',
    text: 'text-teal-800',
  },
};

export interface SpkNominalInput {
  nilaiKontrak: number;
}

export interface SpkPembayaranCalcRow {
  jenis: SpkPembayaranJenis;
  status: SpkPembayaranStatus;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
): SpkKasbonTargetTermin | null {
  const t55 = pembayaranList.find((p) => p.jenis === 'TERMIN_55');
  if (!t55 || t55.status !== 'SUDAH_DIBAYAR') return 'TERMIN_55';

  const t100 = pembayaranList.find((p) => p.jenis === 'TERMIN_100');
  if (!t100 || t100.status !== 'SUDAH_DIBAYAR') return 'TERMIN_100';

  return null;
}

export function sumKasbonForTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
): number {
  return pembayaranList
    .filter(
      (p) =>
        (p.jenis === 'KASBON' || p.jenis === 'UPAH') && p.mengurangiTermin === termin,
    )
    .reduce((sum, p) => sum + p.nominal, 0);
}

export function sumPengurangJenisForTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
  jenis: 'KASBON' | 'UPAH',
): number {
  return pembayaranList
    .filter((p) => p.jenis === jenis && p.mengurangiTermin === termin)
    .reduce((sum, p) => sum + p.nominal, 0);
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
): number {
  const kontrak = spk.nilaiKontrak;
  switch (jenis) {
    case 'TERMIN_55':
      return Math.max(0, kontrak * 0.5 - sumKasbonForTermin(pembayaranList, 'TERMIN_55'));
    case 'TERMIN_100':
      return Math.max(0, kontrak * 0.45 - sumKasbonForTermin(pembayaranList, 'TERMIN_100'));
    case 'RETENSI':
      return Math.max(0, kontrak * 0.05);
    default:
      return 0;
  }
}

export function calcSisaNilaiKontrak(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
): number {
  const paid = pembayaranList
    .filter((p) => p.status === 'SUDAH_DIBAYAR')
    .reduce((sum, p) => sum + p.nominal, 0);
  return Math.max(0, nilaiKontrak - paid);
}

function getMinProgressForJenis(jenis: SpkPembayaranJenis): number {
  return jenis === 'TERMIN_55' ? SPK_PROGRESS_TERMIN_55 : SPK_PROGRESS_TERMIN_100;
}

function getPrerequisiteJenis(jenis: SpkPembayaranJenis): SpkPembayaranJenis | null {
  if (jenis === 'TERMIN_100') return 'TERMIN_55';
  if (jenis === 'RETENSI') return 'TERMIN_100';
  return null;
}

export interface SpkPembayaranStatusRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  status: SpkPembayaranStatus;
  nominal?: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export interface SpkPengurangTerminRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export function calcTerminBruto(
  nilaiKontrak: number,
  termin: SpkKasbonTargetTermin,
): number {
  return termin === 'TERMIN_55' ? nilaiKontrak * 0.5 : nilaiKontrak * 0.45;
}

export function sumPengurangForTermin(
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
): number {
  return rows
    .filter(
      (p) =>
        p.id !== excludeId &&
        (p.jenis === 'KASBON' || p.jenis === 'UPAH') &&
        p.mengurangiTermin === termin,
    )
    .reduce((sum, p) => sum + p.nominal, 0);
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: { excludeId?: number; additionalNominal?: number },
) {
  const bruto = calcTerminBruto(nilaiKontrak, termin);
  const terpakai = sumPengurangForTermin(rows, termin, options?.excludeId);
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;
  const sisaSetelah = sisa - additional;

  return {
    bruto,
    terpakai,
    sisa,
    additional,
    sisaSetelah,
    allowed: additional <= 0 || sisaSetelah >= 0,
  };
}

export function validatePengurangTerminNominal(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  additionalNominal: number,
  excludeId?: number,
): { allowed: boolean; reason?: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
  });

  if (!cap.allowed) {
    return {
      allowed: false,
      reason: `Total kasbon & upah melebihi plafon ${SPK_KASBON_TARGET_LABEL[termin]}. Plafon: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
    };
  }

  return { allowed: true };
}

export function canRequestKasbon(
  pembayaranList: SpkPembayaranStatusRow[],
  nilaiKontrak?: number,
): {
  allowed: boolean;
  reason?: string;
  targetTermin?: SpkKasbonTargetTermin;
  sisaPengurang?: number;
  brutoTermin?: number;
  terpakai?: number;
} {
  const calcRows: SpkPembayaranCalcRow[] = pembayaranList
    .filter((p) => p.status !== 'DRAFT')
    .map((p) => ({
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));
  const target = getKasbonTargetTermin(calcRows);
  if (!target) {
    return {
      allowed: false,
      reason:
        'Kasbon/upah tidak dapat diajukan: kedua termin sudah dibayar.',
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const rows: SpkPengurangTerminRow[] = pembayaranList
      .filter((p) => p.status !== 'DRAFT')
      .map((p) => ({
        id: p.id,
        jenis: p.jenis,
        nominal: p.nominal ?? 0,
        mengurangiTermin: p.mengurangiTermin,
      }));
    const cap = getPengurangTerminCapacity(nilaiKontrak, rows, target);
    if (cap.sisa <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${SPK_KASBON_TARGET_LABEL[target]} untuk kasbon & upah sudah terpakai penuh.`,
      };
    }
    return {
      allowed: true,
      targetTermin: target,
      sisaPengurang: cap.sisa,
      brutoTermin: cap.bruto,
      terpakai: cap.terpakai,
    };
  }

  return { allowed: true, targetTermin: target };
}

export function canRequestSpkPembayaran(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
): { allowed: boolean; reason?: string; nominal: number } {
  const calcRows: SpkPembayaranCalcRow[] = pembayaranList
    .filter((p) => p.status !== 'DRAFT')
    .map((p) => ({
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));

  if (jenis === 'KASBON' || jenis === 'UPAH') {
    const check = canRequestKasbon(pembayaranList);
    return { allowed: check.allowed, reason: check.reason, nominal: 0 };
  }

  const nominal = calcSpkPembayaranNominal(jenis, spk, calcRows);

  if (pembayaranList.some((p) => p.jenis === jenis)) {
    return { allowed: false, reason: 'Pengajuan termin ini sudah ada.', nominal };
  }

  if (spk.progress < getMinProgressForJenis(jenis)) {
    return {
      allowed: false,
      reason: `Progress SPK minimal ${getMinProgressForJenis(jenis)}%.`,
      nominal,
    };
  }

  const prereq = getPrerequisiteJenis(jenis);
  if (
    prereq &&
    !pembayaranList.some((p) => p.jenis === prereq && p.status === 'SUDAH_DIBAYAR')
  ) {
    return {
      allowed: false,
      reason: `Harus menunggu pembayaran ${SPK_PEMBAYARAN_JENIS_LABEL[prereq]} oleh finance.`,
      nominal,
    };
  }

  if (nominal <= 0) {
    return {
      allowed: false,
      reason: 'Nominal pembayaran tidak valid (kasbon/upah mungkin sudah melebihi termin).',
      nominal,
    };
  }

  return { allowed: true, nominal };
}
