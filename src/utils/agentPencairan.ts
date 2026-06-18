import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData, AgentPencairanTahap } from '../services/agentPencairan.service';

export const KOMISI_CASH_PPJB_RATIO = 0.5;

export const isCashPayment = (caraPembayaran?: string | null) => {
  const key = (caraPembayaran ?? '').replace(/\s/g, '_').toUpperCase();
  return key === 'CASH_KERAS' || key === 'CASH_BERTAHAP';
};

export const isPenjualanBatal = (status?: string | null) =>
  (status ?? '').toUpperCase() === 'BATAL';

export const isBookingFeePaid = (
  detail?: { tagihan?: Array<{ pembayaran?: string; tujuan?: string; status?: string }> },
) =>
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

type SaleDetail = {
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

export const calcPencairanAmountsForTahap = (
  tahap: AgentPencairanTahap,
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  const bookingPaid = isBookingFeePaid(detail);
  const isCash = isCashPayment(detail?.caraPembayaran);
  const isBatal = isPenjualanBatal(detail?.status);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const hargaJual = Number(detail?.hargaJual) || 0;
  const feeMarketingPct = Number(agent.feeMarketingPct) || 0;
  const potonganPphPct = Number(agent.potonganPph) || 0;

  const closingFull = bookingPaid
    ? Number(feeRecord.closingNominal) || Number(agent.feeClosingNominal) || 0
    : 0;

  let closingNominal = 0;
  let marketingNominal = 0;

  const fullMarketingBase = nilaiAjb > 0 ? nilaiAjb : hargaJual;
  const fullMarketing =
    fullMarketingBase > 0 && feeMarketingPct > 0
      ? fullMarketingBase * (feeMarketingPct / 100)
      : 0;

  if (tahap === 'PPJB') {
    closingNominal = closingFull;
    if (isCash && !isBatal) {
      marketingNominal = fullMarketing * KOMISI_CASH_PPJB_RATIO;
    }
  } else if (isCash) {
    marketingNominal = fullMarketing * KOMISI_CASH_PPJB_RATIO;
  } else {
    marketingNominal = nilaiAjb > 0 ? fullMarketing : 0;
  }

  const potonganPph = (closingNominal + marketingNominal) * (potonganPphPct / 100);
  const totalNominal = closingNominal + marketingNominal - potonganPph;

  return { closingNominal, marketingNominal, potonganPph, totalNominal };
};

export const getNextPencairanTahap = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
): AgentPencairanTahap | null => {
  if (!feeRecord) return null;

  const existingTahaps = pencairanList.map((p) => p.tahap);
  const isCash = isCashPayment(detail?.caraPembayaran);
  const isBatal = isPenjualanBatal(detail?.status);
  const hasPpjb = hasPpjbComplete(detail?.progressPenjualan);
  const hasSp3k = hasSp3kComplete(detail?.progressPenjualan);
  const bookingPaid = isBookingFeePaid(detail);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const ppjbRecord = pencairanList.find((p) => p.tahap === 'PPJB');
  const ppjbSudahDibayar = ppjbRecord?.status === 'SUDAH_DIBAYAR';

  if (isBatal) {
    if (bookingPaid && !existingTahaps.includes('PPJB')) {
      const amounts = calcPencairanAmountsForTahap('PPJB', agent, feeRecord, detail);
      if (amounts.totalNominal > 0) return 'PPJB';
    }
    return null;
  }

  if (isCash) {
    if (hasPpjb && bookingPaid && !existingTahaps.includes('PPJB')) {
      const amounts = calcPencairanAmountsForTahap('PPJB', agent, feeRecord, detail);
      if (amounts.totalNominal > 0) return 'PPJB';
    }
    if (nilaiAjb > 0 && ppjbSudahDibayar && !existingTahaps.includes('AJB')) {
      const amounts = calcPencairanAmountsForTahap('AJB', agent, feeRecord, detail);
      if (amounts.totalNominal > 0) return 'AJB';
    }
    return null;
  }

  if (hasSp3k && bookingPaid && !existingTahaps.includes('PPJB')) {
    const amounts = calcPencairanAmountsForTahap('PPJB', agent, feeRecord, detail);
    if (amounts.totalNominal > 0) return 'PPJB';
  }
  if (nilaiAjb > 0 && ppjbSudahDibayar && !existingTahaps.includes('AJB')) {
    const amounts = calcPencairanAmountsForTahap('AJB', agent, feeRecord, detail);
    if (amounts.totalNominal > 0) return 'AJB';
  }
  return null;
};

export const getPencairanPaymentStatus = (pencairanList: AgentPencairanData[]) => {
  if (pencairanList.length === 0) {
    return { label: 'Belum', className: 'bg-red-100 text-red-700' };
  }
  const allPaid = pencairanList.every((p) => p.status === 'SUDAH_DIBAYAR');
  const anyWaiting = pencairanList.some((p) => p.status === 'MENUNGGU_PEMBAYARAN');
  const ppjbPaid = pencairanList.some(
    (p) => p.tahap === 'PPJB' && p.status === 'SUDAH_DIBAYAR',
  );
  const ajbExists = pencairanList.some((p) => p.tahap === 'AJB');

  if (allPaid) {
    return { label: 'Sudah', className: 'bg-green-100 text-green-700' };
  }
  if (anyWaiting) {
    return { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' };
  }
  if (ppjbPaid && !ajbExists) {
    return { label: 'Sebagian', className: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' };
};

export const getTahapLabel = (
  tahap: AgentPencairanTahap,
  detail?: Pick<SaleDetail, 'status' | 'caraPembayaran'>,
) => {
  const isBatal = isPenjualanBatal(detail?.status);
  const isCash = isCashPayment(detail?.caraPembayaran);

  if (tahap === 'PPJB') {
    if (isBatal) return 'Closing Fee (Transaksi Batal)';
    if (isCash) return 'PPJB (Closing 100% + Komisi 50%)';
    return 'SP3K (Closing Fee)';
  }
  if (isCash) return 'AJB (Sisa Komisi 50%)';
  return 'AJB (Komisi Marketing)';
};
