import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData } from '../services/agentPencairan.service';

export const KOMISI_CASH_PPJB_RATIO = 0.5;

export type SaleDetail = {
  status?: string | null;
  caraPembayaran?: string | null;
  hargaJual?: number | null;
  tagihan?: Array<{ pembayaran?: string; tujuan?: string; status?: string }>;
  progressPenjualan?: {
    nilaiAjb?: number | null;
    filePpjb?: string | null;
    fileSp3k?: string | null;
  } | null;
};

export type PencairanKomponenKey = 'closing' | 'marketing';

export const isCashPayment = (caraPembayaran?: string | null) => {
  const key = (caraPembayaran ?? '').replace(/\s/g, '_').toUpperCase();
  return key === 'CASH_KERAS' || key === 'CASH_BERTAHAP';
};

export const isPenjualanBatal = (status?: string | null) =>
  (status ?? '').toUpperCase() === 'BATAL';

export const isBookingFeePaid = (detail?: SaleDetail) =>
  (detail?.tagihan ?? []).some(
    (t) =>
      (t.tujuan === 'BOOKING_FEE' || t.pembayaran?.toLowerCase().includes('booking')) &&
      t.status === 'LUNAS',
  );

export const hasPpjbComplete = (
  progress?: { filePpjb?: string | null } | null,
) => !!progress?.filePpjb;

export const hasSp3kComplete = (
  progress?: { fileSp3k?: string | null } | null,
) => !!progress?.fileSp3k;

const buildCalcCtx = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => ({
  penjualanStatus: detail?.status,
  caraPembayaran: detail?.caraPembayaran ?? null,
  hargaJual: Number(detail?.hargaJual) || 0,
  agent: {
    feeMarketingPct: agent.feeMarketingPct,
    feeClosingNominal: agent.feeClosingNominal,
    potonganPph: agent.potonganPph,
  },
  feeAgent: { closingNominal: feeRecord.closingNominal },
  nilaiAjb: Number(detail?.progressPenjualan?.nilaiAjb) || 0,
  tagihanList: detail?.tagihan ?? [],
  hasPpjb: hasPpjbComplete(detail?.progressPenjualan),
  hasSp3k: hasSp3kComplete(detail?.progressPenjualan),
});

const sumSudahDiajukan = (pencairanList: AgentPencairanData[]) => ({
  closingNominal: pencairanList.reduce((s, p) => s + Number(p.closingNominal), 0),
  marketingNominal: pencairanList.reduce((s, p) => s + Number(p.marketingNominal), 0),
  tahaps: pencairanList.map((p) => p.tahap),
});

const getClosingFull = (agent: AgentData, feeRecord: FeeAgentData, detail?: SaleDetail) => {
  if (!isBookingFeePaid(detail)) return 0;
  return Number(feeRecord.closingNominal) || Number(agent.feeClosingNominal) || 0;
};

const getMarketingEntitlement = (
  agent: AgentData,
  detail?: SaleDetail,
) => {
  if (isPenjualanBatal(detail?.status)) return 0;
  if (!isBookingFeePaid(detail)) return 0;

  const isCash = isCashPayment(detail?.caraPembayaran);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const hargaJual = Number(detail?.hargaJual) || 0;
  const pct = Number(agent.feeMarketingPct) || 0;

  if (nilaiAjb > 0) return nilaiAjb * (pct / 100);
  if (isCash && hasPpjbComplete(detail?.progressPenjualan)) {
    return hargaJual * (pct / 100) * KOMISI_CASH_PPJB_RATIO;
  }
  return 0;
};

export const getTotalFeeReferensi = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  if (isPenjualanBatal(detail?.status)) {
    return getClosingFull(agent, feeRecord, detail);
  }
  return getClosingFull(agent, feeRecord, detail) + getMarketingEntitlement(agent, detail);
};

export const calcPotonganPphFromReferensi = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  const total = getTotalFeeReferensi(agent, feeRecord, detail);
  const pct = Number(agent.potonganPph) || 0;
  return total * (pct / 100);
};

export interface PencairanKomponenInfo {
  key: PencairanKomponenKey;
  label: string;
  nominalPenuh: number;
  nominalSisa: number;
  eligible: boolean;
  alasan?: string;
}

export const getPencairanKomponen = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
): PencairanKomponenInfo[] => {
  const sudah = sumSudahDiajukan(pencairanList);
  const isCash = isCashPayment(detail?.caraPembayaran);
  const isBatal = isPenjualanBatal(detail?.status);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const closingFull = getClosingFull(agent, feeRecord, detail);
  const entitlement = getMarketingEntitlement(agent, detail);
  const closingSisa = Math.max(0, closingFull - sudah.closingNominal);
  const marketingSisa = Math.max(0, entitlement - sudah.marketingNominal);

  const closing: PencairanKomponenInfo = {
    key: 'closing',
    label: 'Closing Fee',
    nominalPenuh: closingFull,
    nominalSisa: closingSisa,
    eligible: false,
    alasan: 'Closing fee sudah diajukan semua',
  };

  if (closingSisa > 0) {
    if (!isBookingFeePaid(detail)) {
      closing.alasan = 'Booking fee belum lunas';
    } else if (isBatal) {
      closing.eligible = true;
      closing.alasan = 'Transaksi batal — closing fee dapat dicairkan';
    } else if (isCash && hasPpjbComplete(detail?.progressPenjualan)) {
      closing.eligible = true;
      closing.alasan = 'Dokumen PPJB sudah diunggah & booking lunas';
    } else if (!isCash && hasSp3kComplete(detail?.progressPenjualan)) {
      closing.eligible = true;
      closing.alasan = 'Dokumen SP3K sudah diunggah & booking lunas';
    } else if (isCash) {
      closing.alasan = 'Upload dokumen PPJB di Progress Penjualan';
    } else {
      closing.alasan = 'Upload dokumen SP3K di Progress Penjualan';
    }
  }

  const marketing: PencairanKomponenInfo = {
    key: 'marketing',
    label: 'Komisi Marketing',
    nominalPenuh: entitlement,
    nominalSisa: marketingSisa,
    eligible: false,
    alasan: isBatal
      ? 'Transaksi batal — komisi marketing tidak dicairkan'
      : 'Komisi marketing sudah diajukan semua',
  };

  if (!isBatal && entitlement > 0 && marketingSisa > 0) {
    if (!isBookingFeePaid(detail)) {
      marketing.alasan = 'Booking fee belum lunas';
    } else if (nilaiAjb > 0) {
      if (isCash && hasPpjbComplete(detail?.progressPenjualan)) {
        marketing.eligible = true;
        marketing.alasan = 'Nilai AJB & PPJB sudah ada — komisi penuh dapat dicairkan';
      } else if (!isCash && hasSp3kComplete(detail?.progressPenjualan)) {
        marketing.eligible = true;
        marketing.alasan = 'Nilai AJB & SP3K sudah ada — komisi dapat dicairkan';
      } else if (isCash) {
        marketing.alasan = 'Upload dokumen PPJB di Progress Penjualan';
      } else {
        marketing.alasan = 'Upload dokumen SP3K di Progress Penjualan';
      }
    } else if (isCash && hasPpjbComplete(detail?.progressPenjualan)) {
      marketing.eligible = true;
      marketing.label = 'Komisi Marketing (50%)';
      marketing.alasan = 'Komisi 50% — sisa 50% setelah nilai AJB diisi';
    }
  }

  return [closing, marketing];
};

export const hasAnyEligiblePencairan = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
) => {
  if (!feeRecord) return false;
  return getPencairanKomponen(agent, feeRecord, pencairanList, detail).some(
    (k) => k.eligible && k.nominalSisa > 0,
  );
};

export const calcSelectedPencairanTotal = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail: SaleDetail | undefined,
  selected: Set<PencairanKomponenKey>,
) => {
  const komponen = getPencairanKomponen(agent, feeRecord, [], detail);
  let closingNominal = 0;
  let marketingNominal = 0;

  for (const k of komponen) {
    if (!selected.has(k.key) || !k.eligible) continue;
    if (k.key === 'closing') closingNominal = k.nominalSisa;
    if (k.key === 'marketing') marketingNominal = k.nominalSisa;
  }

  const potonganPph = calcPotonganPphFromReferensi(agent, feeRecord, detail);
  const totalTransfer = closingNominal + marketingNominal - potonganPph;

  return {
    closingNominal,
    marketingNominal,
    potonganPph,
    totalTransfer,
    totalFeeReferensi: getTotalFeeReferensi(agent, feeRecord, detail),
  };
};

export const getPencairanBlockReason = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
): string | null => {
  if (hasAnyEligiblePencairan(agent, feeRecord, pencairanList, detail)) {
    return null;
  }
  if (!feeRecord) return 'Data fee agent belum ada';

  const komponen = getPencairanKomponen(agent, feeRecord, pencairanList, detail);
  const first = komponen.find((k) => k.nominalSisa > 0);
  return first?.alasan ?? 'Semua komponen sudah diajukan';
};

export const getPencairanPaymentStatus = (pencairanList: AgentPencairanData[]) => {
  if (pencairanList.length === 0) {
    return { label: 'Belum', className: 'bg-red-100 text-red-700' };
  }
  const allPaid = pencairanList.every((p) => p.status === 'SUDAH_DIBAYAR');
  const anyWaiting = pencairanList.some((p) => p.status === 'MENUNGGU_PEMBAYARAN');

  if (allPaid) {
    return { label: 'Sudah', className: 'bg-green-100 text-green-700' };
  }
  if (anyWaiting) {
    return { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Sebagian', className: 'bg-blue-100 text-blue-700' };
};
