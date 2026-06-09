export type SpkTerminPembayaranJenis = 'TERMIN_55' | 'TERMIN_100' | 'RETENSI';
export type SpkPembayaranJenis = SpkTerminPembayaranJenis | 'KASBON' | 'UPAH';
export type SpkPembayaranStatus =
  | 'MENUNGGU_PEMBAYARAN'
  | 'MENUNGGU_PERSETUJUAN'
  | 'SUDAH_DIBAYAR'
  | 'DRAFT';
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
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    row: 'bg-blue-50/60',
    text: 'text-blue-700',
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

export const SPK_PEMBAYARAN_STATUS_LABEL: Record<SpkPembayaranStatus, string> = {
  MENUNGGU_PERSETUJUAN: 'Menunggu Pengawas',
  MENUNGGU_PEMBAYARAN: 'Menunggu Finance',
  SUDAH_DIBAYAR: 'Sudah Dibayar',
  DRAFT: 'Draft',
};

export interface SpkNominalInput {
  nilaiKontrak: number;
}

export interface SpkPembayaranCalcRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  status: SpkPembayaranStatus;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export interface SpkPengurangTerminRow {
  id?: number;
  jenis: SpkPembayaranJenis;
  nominal: number;
  mengurangiTermin?: SpkKasbonTargetTermin | null;
}

export interface PengurangWaterfallResult {
  termin55: number;
  termin100: number;
  overflow: number;
}

export interface TerminPaymentStatus {
  termin55Paid: boolean;
  termin100Paid: boolean;
}

export function getTerminPaymentStatus(
  pembayaranList: SpkPembayaranCalcRow[],
): TerminPaymentStatus {
  const t55 = pembayaranList.find((p) => p.jenis === 'TERMIN_55');
  const t100 = pembayaranList.find((p) => p.jenis === 'TERMIN_100');
  return {
    termin55Paid: t55?.status === 'SUDAH_DIBAYAR',
    termin100Paid: t100?.status === 'SUDAH_DIBAYAR',
  };
}

export interface GetKasbonTargetTerminOptions {
  nilaiKontrak?: number;
  pengurangRows?: SpkPengurangTerminRow[];
}

export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  options?: GetKasbonTargetTerminOptions,
): SpkKasbonTargetTermin | null {
  const terminStatus = getTerminPaymentStatus(pembayaranList);
  const t55 = pembayaranList.find((p) => p.jenis === 'TERMIN_55');
  const t100 = pembayaranList.find((p) => p.jenis === 'TERMIN_100');

  if (!t55 || t55.status !== 'SUDAH_DIBAYAR') {
    if (
      options?.nilaiKontrak != null &&
      options.nilaiKontrak > 0 &&
      options.pengurangRows
    ) {
      const bruto55 = calcTerminBruto(options.nilaiKontrak, 'TERMIN_55');
      const alloc = allocatePengurangWaterfall(
        options.nilaiKontrak,
        options.pengurangRows,
        { terminStatus },
      );
      if (alloc.termin55 >= bruto55) {
        if (!t100 || t100.status !== 'SUDAH_DIBAYAR') return 'TERMIN_100';
        return null;
      }
    }
    return 'TERMIN_55';
  }

  if (!t100 || t100.status !== 'SUDAH_DIBAYAR') return 'TERMIN_100';

  return null;
}

export interface PengurangRowSplit {
  termin55: number;
  termin100: number;
}

/** Berapa nominal satu baris kasbon/upah yang mengurangi masing-masing termin (waterfall). */
export function getPengurangRowWaterfallSplit(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  rowId: number,
  terminStatus?: TerminPaymentStatus,
): PengurangRowSplit {
  const without = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: rowId,
    terminStatus,
  });
  const withRow = allocatePengurangWaterfall(nilaiKontrak, rows, {
    terminStatus,
  });
  return {
    termin55: withRow.termin55 - without.termin55,
    termin100: withRow.termin100 - without.termin100,
  };
}

export function formatPengurangMengurangiLabel(
  split: PengurangRowSplit,
  formatAmount: (n: number) => string,
): string {
  const parts: string[] = [];
  if (split.termin55 > 0) {
    parts.push(`${SPK_KASBON_TARGET_LABEL.TERMIN_55} ${formatAmount(split.termin55)}`);
  }
  if (split.termin100 > 0) {
    parts.push(`${SPK_KASBON_TARGET_LABEL.TERMIN_100} ${formatAmount(split.termin100)}`);
  }
  return parts.length ? parts.join(' + ') : '—';
}

function isPengurangJenis(jenis: SpkPembayaranJenis): jenis is 'KASBON' | 'UPAH' {
  return jenis === 'KASBON' || jenis === 'UPAH';
}

function sortPengurangRows(rows: SpkPengurangTerminRow[]): SpkPengurangTerminRow[] {
  return [...rows]
    .filter((p) => isPengurangJenis(p.jenis))
    .sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER));
}

/** FIFO: isi plafon termin 55 dulu, kelebihan mengalir ke termin 100. */
export function allocatePengurangWaterfall(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
  },
): PengurangWaterfallResult {
  const bruto55 = calcTerminBruto(nilaiKontrak, 'TERMIN_55');
  const bruto100 = calcTerminBruto(nilaiKontrak, 'TERMIN_100');

  let filled55 = options?.terminStatus?.termin55Paid ? bruto55 : 0;
  let filled100 = options?.terminStatus?.termin100Paid ? bruto100 : 0;

  const consume = (nominal: number) => {
    let remaining = nominal;
    const to55 = Math.min(remaining, Math.max(0, bruto55 - filled55));
    filled55 += to55;
    remaining -= to55;
    const to100 = Math.min(remaining, Math.max(0, bruto100 - filled100));
    filled100 += to100;
    remaining -= to100;
    return remaining;
  };

  for (const row of sortPengurangRows(rows)) {
    if (row.id === options?.excludeId) continue;
    consume(row.nominal);
  }

  const overflow = consume(options?.additionalNominal ?? 0);

  return { termin55: filled55, termin100: filled100, overflow };
}

function toPengurangRowsFromCalc(
  pembayaranList: SpkPembayaranCalcRow[],
): SpkPengurangTerminRow[] {
  return pembayaranList
    .filter((p) => isPengurangJenis(p.jenis))
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal,
      mengurangiTermin: p.mengurangiTermin,
    }));
}

export function sumKasbonForTermin(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
): number {
  const allocated = allocatePengurangWaterfall(
    nilaiKontrak,
    toPengurangRowsFromCalc(pembayaranList),
    { terminStatus: getTerminPaymentStatus(pembayaranList) },
  );
  return termin === 'TERMIN_55' ? allocated.termin55 : allocated.termin100;
}

export function sumPengurangJenisForTermin(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
  jenis: 'KASBON' | 'UPAH',
): number {
  const bruto55 = calcTerminBruto(nilaiKontrak, 'TERMIN_55');
  const bruto100 = calcTerminBruto(nilaiKontrak, 'TERMIN_100');
  const terminStatus = getTerminPaymentStatus(pembayaranList);

  let filled55 = terminStatus.termin55Paid ? bruto55 : 0;
  let filled100 = terminStatus.termin100Paid ? bruto100 : 0;
  let total = 0;

  const consume = (nominal: number, rowJenis: 'KASBON' | 'UPAH') => {
    let remaining = nominal;
    const to55 = Math.min(remaining, Math.max(0, bruto55 - filled55));
    if (to55 > 0 && rowJenis === jenis && termin === 'TERMIN_55') total += to55;
    filled55 += to55;
    remaining -= to55;
    const to100 = Math.min(remaining, Math.max(0, bruto100 - filled100));
    if (to100 > 0 && rowJenis === jenis && termin === 'TERMIN_100') total += to100;
    filled100 += to100;
    remaining -= to100;
    return remaining;
  };

  for (const row of sortPengurangRows(toPengurangRowsFromCalc(pembayaranList))) {
    if (!isPengurangJenis(row.jenis)) continue;
    consume(row.nominal, row.jenis);
  }

  return total;
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
): number {
  const kontrak = spk.nilaiKontrak;
  switch (jenis) {
    case 'TERMIN_55':
      return Math.max(0, kontrak * 0.5 - sumKasbonForTermin(kontrak, pembayaranList, 'TERMIN_55'));
    case 'TERMIN_100':
      return Math.max(0, kontrak * 0.45 - sumKasbonForTermin(kontrak, pembayaranList, 'TERMIN_100'));
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

export function calcTerminBruto(
  nilaiKontrak: number,
  termin: SpkKasbonTargetTermin,
): number {
  return termin === 'TERMIN_55' ? nilaiKontrak * 0.5 : nilaiKontrak * 0.45;
}

export function sumPengurangForTermin(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
): number {
  const allocated = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId,
    terminStatus,
  });
  return termin === 'TERMIN_55' ? allocated.termin55 : allocated.termin100;
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
  },
) {
  const bruto55 = calcTerminBruto(nilaiKontrak, 'TERMIN_55');
  const bruto100 = calcTerminBruto(nilaiKontrak, 'TERMIN_100');
  const bruto = calcTerminBruto(nilaiKontrak, termin);

  const before = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: options?.excludeId,
    terminStatus: options?.terminStatus,
  });
  const after = allocatePengurangWaterfall(nilaiKontrak, rows, options);

  const terpakai = termin === 'TERMIN_55' ? before.termin55 : before.termin100;
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;

  const terpakaiSetelah =
    termin === 'TERMIN_55' ? after.termin55 : after.termin100;
  const sisaSetelah = Math.max(0, bruto - terpakaiSetelah);

  const spilloverKeTermin100 = Math.max(0, after.termin100 - before.termin100);
  const combinedSisa =
    Math.max(0, bruto55 - before.termin55) + Math.max(0, bruto100 - before.termin100);

  return {
    bruto,
    terpakai,
    sisa,
    additional,
    sisaSetelah,
    spilloverKeTermin100,
    combinedSisa,
    allowed: after.overflow <= 0,
  };
}

export function validatePengurangTerminNominal(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  additionalNominal: number,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
): { allowed: boolean; reason?: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
    terminStatus,
  });

  if (!cap.allowed) {
    const bruto55 = calcTerminBruto(nilaiKontrak, 'TERMIN_55');
    const bruto100 = calcTerminBruto(nilaiKontrak, 'TERMIN_100');
    return {
      allowed: false,
      reason:
        termin === 'TERMIN_55'
          ? `Total kasbon & upah melebihi plafon gabungan termin 55% dan 100%. Plafon gabungan: ${bruto55 + bruto100}, sisa tersedia: ${cap.combinedSisa}, nominal diajukan: ${additionalNominal}.`
          : `Total kasbon & upah melebihi plafon ${SPK_KASBON_TARGET_LABEL[termin]}. Plafon: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
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
      id: p.id,
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));
  const pengurangRowsForTarget: SpkPengurangTerminRow[] = pembayaranList
    .filter((p) => p.status !== 'DRAFT')
    .map((p) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal ?? 0,
      mengurangiTermin: p.mengurangiTermin,
    }));
  const target = getKasbonTargetTermin(calcRows, {
    nilaiKontrak,
    pengurangRows: pengurangRowsForTarget,
  });
  if (!target) {
    return {
      allowed: false,
      reason:
        'Kasbon/upah tidak dapat diajukan: kedua termin sudah dibayar.',
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const cap = getPengurangTerminCapacity(nilaiKontrak, pengurangRowsForTarget, target, {
      terminStatus: getTerminPaymentStatus(calcRows),
    });
    const sisaPengurang = target === 'TERMIN_55' ? cap.combinedSisa : cap.sisa;
    if (sisaPengurang <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${SPK_KASBON_TARGET_LABEL[target]} untuk kasbon & upah sudah terpakai penuh.`,
      };
    }
    return {
      allowed: true,
      targetTermin: target,
      sisaPengurang,
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
      id: p.id,
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

  return { allowed: true, nominal };
}
