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
    fileAjb?: string | null;
    fileSp3k?: string | null;
    fileSuratPernyataanAkadKredit?: string | null;
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
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.filePpjb;

export const hasSp3kComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.fileSp3k;

export const hasAjbComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.fileAjb;

export const hasAkadKreditComplete = (
  progress?: SaleDetail['progressPenjualan'],
) =>
  !!(
    progress?.filePpjb ||
    progress?.fileAjb ||
    progress?.fileSuratPernyataanAkadKredit
  );

const sumSudahDiajukan = (pencairanList: AgentPencairanData[]) => ({
  closingNominal: pencairanList.reduce((s, p) => s + Number(p.closingNominal), 0),
  marketingNominal: pencairanList.reduce((s, p) => s + Number(p.marketingNominal), 0),
});

const getClosingFull = (agent: AgentData, feeRecord: FeeAgentData, detail?: SaleDetail) => {
  if (!isBookingFeePaid(detail)) return 0;
  return Number(feeRecord.closingNominal) || Number(agent.feeClosingNominal) || 0;
};

const getFullMarketingFee = (agent: AgentData, detail?: SaleDetail) => {
  if (isPenjualanBatal(detail?.status)) return 0;
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const hargaJual = Number(detail?.hargaJual) || 0;
  const pct = Number(agent.feeMarketingPct) || 0;
  const base = nilaiAjb > 0 ? nilaiAjb : hargaJual;
  return base > 0 && pct > 0 ? base * (pct / 100) : 0;
};

const getCashMarketingBuckets = (
  agent: AgentData,
  detail: SaleDetail | undefined,
  sudahMarketing: number,
) => {
  const full = getFullMarketingFee(agent, detail);
  const ppjbCap = full * KOMISI_CASH_PPJB_RATIO;
  const ajbCap = full - ppjbCap;
  const ppjbSudah = Math.min(sudahMarketing, ppjbCap);
  const ajbSudah = Math.max(0, sudahMarketing - ppjbCap);
  return {
    ppjbSisa: Math.max(0, ppjbCap - ppjbSudah),
    ajbSisa: Math.max(0, ajbCap - ajbSudah),
  };
};

export const getTotalFeeReferensi = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  if (isPenjualanBatal(detail?.status)) {
    return getClosingFull(agent, feeRecord, detail);
  }
  return getClosingFull(agent, feeRecord, detail) + getFullMarketingFee(agent, detail);
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
  const fullMarketing = getFullMarketingFee(agent, detail);
  const closingSisa = Math.max(0, closingFull - sudah.closingNominal);

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
      closing.alasan = 'Upload dokumen PPJB di menu Progress Penjualan';
    } else {
      closing.alasan = 'Upload dokumen SP3K di menu Progress Penjualan';
    }
  }

  const marketing: PencairanKomponenInfo = {
    key: 'marketing',
    label: 'Komisi Marketing',
    nominalPenuh: fullMarketing,
    nominalSisa: 0,
    eligible: false,
    alasan: 'Komisi marketing belum tersedia',
  };

  if (!isBatal && fullMarketing > 0 && isBookingFeePaid(detail)) {
    if (isCash) {
      const buckets = getCashMarketingBuckets(agent, detail, sudah.marketingNominal);
      marketing.nominalSisa = buckets.ppjbSisa + buckets.ajbSisa;

      if (marketing.nominalSisa <= 0) {
        marketing.alasan = 'Komisi marketing sudah diajukan semua';
      } else {
        const ppjbOk = buckets.ppjbSisa > 0 && hasPpjbComplete(detail?.progressPenjualan);
        const ajbOk =
          buckets.ajbSisa > 0 &&
          hasPpjbComplete(detail?.progressPenjualan) &&
          hasAjbComplete(detail?.progressPenjualan) &&
          nilaiAjb > 0;

        if (ppjbOk || ajbOk) {
          marketing.eligible = true;
          const parts: string[] = [];
          if (ppjbOk) parts.push('50% tahap PPJB');
          if (ajbOk) parts.push('50% tahap AJB');
          marketing.alasan = `Komisi tersedia: ${parts.join(' + ')}`;
        } else if (buckets.ppjbSisa > 0) {
          marketing.alasan = 'Upload dokumen PPJB di menu Progress Penjualan (tahap 50%)';
        } else {
          marketing.alasan = hasAjbComplete(detail?.progressPenjualan)
            ? 'Isi nilai AJB di menu Progress Penjualan'
            : 'Upload dokumen AJB di menu Progress Penjualan (sisa 50%)';
        }
      }
    } else {
      marketing.nominalSisa = Math.max(0, fullMarketing - sudah.marketingNominal);

      if (marketing.nominalSisa <= 0) {
        marketing.alasan = 'Komisi marketing sudah diajukan semua';
      } else if (!hasSp3kComplete(detail?.progressPenjualan)) {
        marketing.alasan = 'Upload dokumen SP3K di menu Progress Penjualan';
      } else if (!hasAkadKreditComplete(detail?.progressPenjualan)) {
        marketing.alasan =
          'Upload dokumen PPJB atau AJB (akad kredit) di menu Progress Penjualan';
      } else if (nilaiAjb <= 0) {
        marketing.alasan = 'Isi nilai AJB di menu Progress Penjualan';
      } else {
        marketing.eligible = true;
        marketing.alasan = 'SP3K & akad kredit sudah ada — komisi dari nilai AJB';
      }
    }
  } else if (!isBookingFeePaid(detail)) {
    marketing.alasan = 'Booking fee belum lunas';
  } else if (isBatal) {
    marketing.alasan = 'Transaksi batal — komisi marketing tidak dicairkan';
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
  const first = komponen.find((k) => k.nominalSisa > 0 || !k.eligible);
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
