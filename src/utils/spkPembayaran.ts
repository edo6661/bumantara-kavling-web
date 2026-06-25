import type { SpkJenis } from '../services/spk.service';
import {
  buildAllSpkKasbonTargetLabel,
  buildAllSpkPembayaranJenisLabel,
  buildSpkKasbonTargetLabel,
  buildSpkPembayaranJenisLabel,
  buildTerminUiColors,
  getKasbonTargetSteps,
  getPrerequisiteTerminJenis,
  getSpkTerminScheme,
  getTerminStep,
  type SpkKasbonTargetTermin,
  type SpkTerminPembayaranJenis,
  type SpkTerminStepConfig,
} from './spkTerminScheme';

export type { SpkKasbonTargetTermin, SpkTerminPembayaranJenis } from './spkTerminScheme';

export type SpkPembayaranJenis = SpkTerminPembayaranJenis | 'KASBON' | 'UPAH';
export type SpkPembayaranStatus =
  | 'MENUNGGU_PEMBAYARAN'
  | 'MENUNGGU_PERSETUJUAN'
  | 'SUDAH_DIBAYAR'
  | 'DRAFT';

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL = buildAllSpkPembayaranJenisLabel();
export const SPK_KASBON_TARGET_LABEL = buildAllSpkKasbonTargetLabel();

export const JENIS_UI_COLOR: Record<
  SpkPembayaranJenis,
  { badge: string; row: string; text: string }
> = {
  ...buildTerminUiColors('RUMAH'),
  ...buildTerminUiColors('INFRASTRUKTUR'),
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

export function getJenisUiColor(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = 'RUMAH',
) {
  if (jenis === 'KASBON' || jenis === 'UPAH') {
    return JENIS_UI_COLOR[jenis];
  }
  return buildTerminUiColors(spkJenis)[jenis] ?? JENIS_UI_COLOR.RETENSI;
}

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
  byTarget: Partial<Record<SpkKasbonTargetTermin, number>>;
  overflow: number;
}

export type TerminPaymentStatus = Partial<Record<SpkKasbonTargetTermin, boolean>>;

function isPengurangJenis(jenis: SpkPembayaranJenis): jenis is 'KASBON' | 'UPAH' {
  return jenis === 'KASBON' || jenis === 'UPAH';
}

function sortPengurangRows(rows: SpkPengurangTerminRow[]): SpkPengurangTerminRow[] {
  return [...rows]
    .filter((p) => isPengurangJenis(p.jenis))
    .sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER));
}

function getTargetBrutoMap(
  scheme: SpkTerminStepConfig[],
  nilaiKontrak: number,
): Record<SpkKasbonTargetTermin, number> {
  const map = {} as Record<SpkKasbonTargetTermin, number>;
  for (const step of getKasbonTargetSteps(scheme)) {
    map[step.jenis] = nilaiKontrak * step.kontrakFraction;
  }
  return map;
}

export function getTerminPaymentStatus(
  pembayaranList: SpkPembayaranCalcRow[],
  spkJenis: SpkJenis = 'RUMAH',
): TerminPaymentStatus {
  const scheme = getSpkTerminScheme(spkJenis);
  const status: TerminPaymentStatus = {};
  for (const step of getKasbonTargetSteps(scheme)) {
    const row = pembayaranList.find((p) => p.jenis === step.jenis);
    status[step.jenis] = row?.status === 'SUDAH_DIBAYAR';
  }
  return status;
}

export interface GetKasbonTargetTerminOptions {
  nilaiKontrak?: number;
  pengurangRows?: SpkPengurangTerminRow[];
  spkJenis?: SpkJenis;
}

export function getKasbonTargetTermin(
  pembayaranList: SpkPembayaranCalcRow[],
  options?: GetKasbonTargetTerminOptions,
): SpkKasbonTargetTermin | null {
  const spkJenis = options?.spkJenis ?? 'RUMAH';
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const terminStatus = getTerminPaymentStatus(pembayaranList, spkJenis);

  for (const step of targets) {
    const target = step.jenis;
    const terminRow = pembayaranList.find((p) => p.jenis === step.jenis);

    if (!terminRow || terminRow.status !== 'SUDAH_DIBAYAR') {
      if (
        options?.nilaiKontrak != null &&
        options.nilaiKontrak > 0 &&
        options.pengurangRows
      ) {
        const bruto = calcTerminBruto(options.nilaiKontrak, target, spkJenis);
        const alloc = allocatePengurangWaterfall(
          options.nilaiKontrak,
          options.pengurangRows,
          { terminStatus, spkJenis },
        );
        if ((alloc.byTarget[target] ?? 0) >= bruto) {
          continue;
        }
      }
      return target;
    }
  }

  return null;
}

export interface PengurangRowSplit {
  byTarget: Partial<Record<SpkKasbonTargetTermin, number>>;
}

export function getPengurangRowWaterfallSplit(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  rowId: number,
  terminStatus?: TerminPaymentStatus,
  spkJenis: SpkJenis = 'RUMAH',
): PengurangRowSplit {
  const without = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: rowId,
    terminStatus,
    spkJenis,
  });
  const withRow = allocatePengurangWaterfall(nilaiKontrak, rows, {
    terminStatus,
    spkJenis,
  });

  const byTarget: Partial<Record<SpkKasbonTargetTermin, number>> = {};
  const keys = new Set([
    ...Object.keys(without.byTarget),
    ...Object.keys(withRow.byTarget),
  ]) as Set<SpkKasbonTargetTermin>;

  for (const key of keys) {
    const delta = (withRow.byTarget[key] ?? 0) - (without.byTarget[key] ?? 0);
    if (delta > 0) byTarget[key] = delta;
  }

  return { byTarget };
}

export function formatPengurangMengurangiLabel(
  split: PengurangRowSplit,
  formatAmount: (n: number) => string,
  spkJenis: SpkJenis = 'RUMAH',
): string {
  const labels = buildSpkKasbonTargetLabel(spkJenis);
  const parts: string[] = [];

  for (const [target, nominal] of Object.entries(split.byTarget)) {
    if (!nominal || nominal <= 0) continue;
    parts.push(`${labels[target as SpkKasbonTargetTermin]} ${formatAmount(nominal)}`);
  }

  return parts.length ? parts.join(' + ') : '—';
}

export function allocatePengurangWaterfall(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
    spkJenis?: SpkJenis;
  },
): PengurangWaterfallResult {
  const spkJenis = options?.spkJenis ?? 'RUMAH';
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const brutoByTarget = getTargetBrutoMap(scheme, nilaiKontrak);

  const filled: Partial<Record<SpkKasbonTargetTermin, number>> = {};
  for (const step of targets) {
    filled[step.jenis] = options?.terminStatus?.[step.jenis]
      ? brutoByTarget[step.jenis]
      : 0;
  }

  const consume = (nominal: number) => {
    let remaining = nominal;
    for (const step of targets) {
      const target = step.jenis;
      const bruto = brutoByTarget[target];
      const current = filled[target] ?? 0;
      const toFill = Math.min(remaining, Math.max(0, bruto - current));
      filled[target] = current + toFill;
      remaining -= toFill;
    }
    return remaining;
  };

  for (const row of sortPengurangRows(rows)) {
    if (row.id === options?.excludeId) continue;
    consume(row.nominal);
  }

  const overflow = consume(options?.additionalNominal ?? 0);
  return { byTarget: filled, overflow };
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
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const allocated = allocatePengurangWaterfall(
    nilaiKontrak,
    toPengurangRowsFromCalc(pembayaranList),
    {
      terminStatus: getTerminPaymentStatus(pembayaranList, spkJenis),
      spkJenis,
    },
  );
  return allocated.byTarget[termin] ?? 0;
}

export function sumPengurangJenisForTermin(
  nilaiKontrak: number,
  pembayaranList: SpkPembayaranCalcRow[],
  termin: SpkKasbonTargetTermin,
  jenis: 'KASBON' | 'UPAH',
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const brutoByTarget = getTargetBrutoMap(scheme, nilaiKontrak);
  const terminStatus = getTerminPaymentStatus(pembayaranList, spkJenis);

  const filled: Partial<Record<SpkKasbonTargetTermin, number>> = {};
  for (const step of targets) {
    filled[step.jenis] = terminStatus[step.jenis] ? brutoByTarget[step.jenis] : 0;
  }

  let total = 0;
  const consume = (nominal: number, rowJenis: 'KASBON' | 'UPAH') => {
    let remaining = nominal;
    for (const step of targets) {
      const target = step.jenis;
      const bruto = brutoByTarget[target];
      const current = filled[target] ?? 0;
      const toFill = Math.min(remaining, Math.max(0, bruto - current));
      if (toFill > 0 && rowJenis === jenis && termin === target) total += toFill;
      filled[target] = current + toFill;
      remaining -= toFill;
    }
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
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const kontrak = spk.nilaiKontrak;
  const step = getTerminStep(getSpkTerminScheme(spkJenis), jenis as SpkTerminPembayaranJenis);
  if (!step) return 0;

  if (step.jenis === 'RETENSI') {
    return Math.max(0, kontrak * step.kontrakFraction);
  }

  const kasbon = sumKasbonForTermin(kontrak, pembayaranList, step.jenis, spkJenis);
  const bruto = kontrak * step.kontrakFraction;
  return Math.max(0, bruto - kasbon);
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

function getMinProgressForJenis(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const step = getTerminStep(
    getSpkTerminScheme(spkJenis),
    jenis as SpkTerminPembayaranJenis,
  );
  return step?.minProgress ?? 100;
}

function getPrerequisiteJenis(
  jenis: SpkPembayaranJenis,
  spkJenis: SpkJenis = 'RUMAH',
): SpkPembayaranJenis | null {
  return getPrerequisiteTerminJenis(
    getSpkTerminScheme(spkJenis),
    jenis as SpkTerminPembayaranJenis,
  );
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
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const step = getTerminStep(getSpkTerminScheme(spkJenis), termin);
  return step ? nilaiKontrak * step.kontrakFraction : 0;
}

export function sumPengurangForTermin(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  excludeId?: number,
  terminStatus?: TerminPaymentStatus,
  spkJenis: SpkJenis = 'RUMAH',
): number {
  const allocated = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId,
    terminStatus,
    spkJenis,
  });
  return allocated.byTarget[termin] ?? 0;
}

export function getPengurangTerminCapacity(
  nilaiKontrak: number,
  rows: SpkPengurangTerminRow[],
  termin: SpkKasbonTargetTermin,
  options?: {
    excludeId?: number;
    additionalNominal?: number;
    terminStatus?: TerminPaymentStatus;
    spkJenis?: SpkJenis;
  },
) {
  const spkJenis = options?.spkJenis ?? 'RUMAH';
  const scheme = getSpkTerminScheme(spkJenis);
  const targets = getKasbonTargetSteps(scheme);
  const brutoByTarget = getTargetBrutoMap(scheme, nilaiKontrak);
  const bruto = brutoByTarget[termin];

  const before = allocatePengurangWaterfall(nilaiKontrak, rows, {
    excludeId: options?.excludeId,
    terminStatus: options?.terminStatus,
    spkJenis,
  });
  const after = allocatePengurangWaterfall(nilaiKontrak, rows, {
    ...options,
    spkJenis,
  });

  const terpakai = before.byTarget[termin] ?? 0;
  const sisa = Math.max(0, bruto - terpakai);
  const additional = options?.additionalNominal ?? 0;
  const terpakaiSetelah = after.byTarget[termin] ?? 0;
  const sisaSetelah = Math.max(0, bruto - terpakaiSetelah);

  const targetIndex = targets.findIndex((step) => step.jenis === termin);
  const spillTarget =
    targetIndex >= 0 && targetIndex < targets.length - 1
      ? targets[targetIndex + 1]!.jenis
      : null;
  const spilloverKeTermin100 = spillTarget
    ? Math.max(0, (after.byTarget[spillTarget] ?? 0) - (before.byTarget[spillTarget] ?? 0))
    : 0;

  let combinedSisa = 0;
  for (let i = Math.max(0, targetIndex); i < targets.length; i++) {
    const target = targets[i]!.jenis;
    combinedSisa += Math.max(0, brutoByTarget[target] - (before.byTarget[target] ?? 0));
  }

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
  spkJenis: SpkJenis = 'RUMAH',
): { allowed: boolean; reason?: string } {
  const cap = getPengurangTerminCapacity(nilaiKontrak, rows, termin, {
    excludeId,
    additionalNominal,
    terminStatus,
    spkJenis,
  });

  if (!cap.allowed) {
    const labels = buildSpkKasbonTargetLabel(spkJenis);
    const targets = getKasbonTargetSteps(getSpkTerminScheme(spkJenis));
    const isFirstTarget = targets[0]?.jenis === termin;

    return {
      allowed: false,
      reason: isFirstTarget
        ? `Total kasbon & upah melebihi plafon gabungan termin. Plafon gabungan sisa tersedia: ${cap.combinedSisa}, nominal diajukan: ${additionalNominal}.`
        : `Total kasbon & upah melebihi plafon ${labels[termin]}. Plafon: ${cap.bruto}, sudah terpakai: ${cap.terpakai}, sisa: ${cap.sisa}, nominal diajukan: ${additionalNominal}.`,
    };
  }

  return { allowed: true };
}

export function canRequestKasbon(
  pembayaranList: SpkPembayaranStatusRow[],
  nilaiKontrak?: number,
  spkJenis: SpkJenis = 'RUMAH',
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
    spkJenis,
  });

  if (!target) {
    return {
      allowed: false,
      reason: 'Kasbon/upah tidak dapat diajukan: semua termin sudah dibayar.',
    };
  }

  if (nilaiKontrak != null && nilaiKontrak > 0) {
    const cap = getPengurangTerminCapacity(nilaiKontrak, pengurangRowsForTarget, target, {
      terminStatus: getTerminPaymentStatus(calcRows, spkJenis),
      spkJenis,
    });
    const labels = buildSpkKasbonTargetLabel(spkJenis);
    const targets = getKasbonTargetSteps(getSpkTerminScheme(spkJenis));
    const isFirstTarget = targets[0]?.jenis === target;
    const sisaPengurang = isFirstTarget ? cap.combinedSisa : cap.sisa;
    if (sisaPengurang <= 0) {
      return {
        allowed: false,
        reason: `Plafon ${labels[target]} untuk kasbon & upah sudah terpakai penuh.`,
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
  spkJenis: SpkJenis = 'RUMAH',
): { allowed: boolean; reason?: string; nominal: number } {
  const labels = buildSpkPembayaranJenisLabel(spkJenis);
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
    const check = canRequestKasbon(pembayaranList, spk.nilaiKontrak, spkJenis);
    return { allowed: check.allowed, reason: check.reason, nominal: 0 };
  }

  const nominal = calcSpkPembayaranNominal(jenis, spk, calcRows, spkJenis);

  if (pembayaranList.some((p) => p.jenis === jenis)) {
    return { allowed: false, reason: 'Pengajuan termin ini sudah ada.', nominal };
  }

  if (spk.progress < getMinProgressForJenis(jenis, spkJenis)) {
    return {
      allowed: false,
      reason: `Progress SPK minimal ${getMinProgressForJenis(jenis, spkJenis)}%.`,
      nominal,
    };
  }

  const prereq = getPrerequisiteJenis(jenis, spkJenis);
  if (
    prereq &&
    !pembayaranList.some((p) => p.jenis === prereq && p.status === 'SUDAH_DIBAYAR')
  ) {
    return {
      allowed: false,
      reason: `Harus menunggu pembayaran ${labels[prereq as SpkTerminPembayaranJenis]} oleh finance.`,
      nominal,
    };
  }

  return { allowed: true, nominal };
}

export {
  getSpkTerminScheme,
  getSpkTerminJenisOrder,
  buildSpkPembayaranJenisLabel,
  buildSpkKasbonTargetLabel,
} from './spkTerminScheme';
