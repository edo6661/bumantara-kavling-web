import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type {
  AgentPencairanData,
  AgentPencairanTahap,
} from '../services/agentPencairan.service';
import {
  KOMISI_CASH_PPJB_RATIO,
  calcPencairanAmountsForTahap,
  getNextPencairanTahap,
  getTahapLabel,
  isBookingFeePaid,
  isCashPayment,
  isPenjualanBatal,
} from './agentPencairan';
import type { SaleDetail } from './agentPencairan';

export type PencairanKomponenKey = 'closing' | 'marketing';

export interface PencairanKomponenPreview {
  key: PencairanKomponenKey;
  label: string;
  nominalPenuh: number;
  nominalDicairkan: number;
  dicairkanSekarang: boolean;
  bisaPilih: boolean;
  alasan?: string;
}

export interface PencairanAjukanPreview {
  tahap: AgentPencairanTahap;
  tahapLabel: string;
  komponenSekarang: PencairanKomponenPreview[];
  komponenBelum: PencairanKomponenPreview[];
  potonganPph: number;
  totalTransfer: number;
  totalFeeReferensi: number;
  catatanTahap: string;
}

const getFullReferenceAmounts = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  const bookingPaid = isBookingFeePaid(detail);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const hargaJual = Number(detail?.hargaJual) || 0;
  const feeMarketingPct = Number(agent.feeMarketingPct) || 0;
  const base = nilaiAjb > 0 ? nilaiAjb : hargaJual;
  const fullMarketing =
    base > 0 && feeMarketingPct > 0 ? base * (feeMarketingPct / 100) : 0;
  const closingFull = bookingPaid
    ? Number(feeRecord.closingNominal) || Number(agent.feeClosingNominal) || 0
    : 0;

  return { fullMarketing, closingFull };
};

export const buildPencairanAjukanPreview = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  pencairanList: AgentPencairanData[],
  detail: SaleDetail | undefined,
): PencairanAjukanPreview | null => {
  const tahap = getNextPencairanTahap(agent, feeRecord, pencairanList, detail);
  if (!tahap) return null;

  const amounts = calcPencairanAmountsForTahap(tahap, agent, feeRecord, detail);
  const { fullMarketing, closingFull } = getFullReferenceAmounts(agent, feeRecord, detail);
  const isCash = isCashPayment(detail?.caraPembayaran);
  const isBatal = isPenjualanBatal(detail?.status);
  const ppjbSudahDibayar = pencairanList.some(
    (p) => p.tahap === 'PPJB' && p.status === 'SUDAH_DIBAYAR',
  );

  const komponenSekarang: PencairanKomponenPreview[] = [];
  const komponenBelum: PencairanKomponenPreview[] = [];

  if (amounts.closingNominal > 0) {
    komponenSekarang.push({
      key: 'closing',
      label: 'Closing Fee',
      nominalPenuh: closingFull,
      nominalDicairkan: amounts.closingNominal,
      dicairkanSekarang: true,
      bisaPilih: true,
      alasan:
        tahap === 'PPJB' && !isCash
          ? 'Dicairkan di tahap SP3K (KPR)'
          : isBatal
            ? 'Transaksi batal — hanya closing fee yang dicairkan'
            : 'Dicairkan di tahap PPJB',
    });
  }

  if (amounts.marketingNominal > 0) {
    const isSetengah = isCash && amounts.marketingNominal < fullMarketing;
    komponenSekarang.push({
      key: 'marketing',
      label: isSetengah ? 'Komisi Marketing (50%)' : 'Komisi Marketing',
      nominalPenuh: fullMarketing,
      nominalDicairkan: amounts.marketingNominal,
      dicairkanSekarang: true,
      bisaPilih: true,
      alasan: isSetengah
        ? `50% komisi tahap ${tahap}, sisa 50% dicairkan di tahap AJB`
        : 'Komisi marketing tahap AJB',
    });
  }

  if (amounts.closingNominal === 0 && closingFull > 0 && tahap === 'AJB') {
    komponenBelum.push({
      key: 'closing',
      label: 'Closing Fee',
      nominalPenuh: closingFull,
      nominalDicairkan: 0,
      dicairkanSekarang: false,
      bisaPilih: false,
      alasan: ppjbSudahDibayar
        ? 'Sudah dicairkan di tahap sebelumnya'
        : 'Closing fee dicairkan di tahap SP3K/PPJB',
    });
  }

  if (amounts.marketingNominal === 0 && fullMarketing > 0) {
    let alasan = 'Belum memenuhi syarat tahap ini';
    if (tahap === 'PPJB' && !isCash && !isBatal) {
      alasan =
        'Komisi marketing KPR dicairkan di tahap AJB, setelah closing fee dibayar finance';
    } else if (tahap === 'PPJB' && isCash) {
      alasan = `Sisa 50% komisi (± ${formatRupiahShort(fullMarketing * KOMISI_CASH_PPJB_RATIO)}) dicairkan di tahap AJB`;
    } else if (isBatal) {
      alasan = 'Transaksi batal — komisi marketing tidak dicairkan';
    }

    komponenBelum.push({
      key: 'marketing',
      label: 'Komisi Marketing',
      nominalPenuh: fullMarketing,
      nominalDicairkan: 0,
      dicairkanSekarang: false,
      bisaPilih: false,
      alasan,
    });
  }

  let catatanTahap = `Pengajuan ini untuk tahap ${getTahapLabel(tahap, detail)}.`;
  if (komponenSekarang.length > 1) {
    catatanTahap +=
      ' Closing fee dan komisi yang dicentang akan diajukan sekaligus dalam satu pengajuan.';
  } else if (komponenBelum.length > 0) {
    catatanTahap +=
      ' Nominal di bawah yang tidak dicentang belum bisa diajukan sekarang — lihat alasannya.';
  }

  return {
    tahap,
    tahapLabel: getTahapLabel(tahap, detail),
    komponenSekarang,
    komponenBelum,
    potonganPph: amounts.potonganPph,
    totalTransfer: amounts.totalNominal,
    totalFeeReferensi: fullMarketing + closingFull,
    catatanTahap,
  };
};

function formatRupiahShort(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

/** Hitung ulang total jika user memilih subset komponen (hanya jika tahap mengizinkan) */
export const calcSelectedPencairanTotal = (
  preview: PencairanAjukanPreview,
  selected: Set<PencairanKomponenKey>,
  potonganPphPct: number,
) => {
  let closingNominal = 0;
  let marketingNominal = 0;

  for (const k of preview.komponenSekarang) {
    if (!selected.has(k.key)) continue;
    if (k.key === 'closing') closingNominal = k.nominalDicairkan;
    if (k.key === 'marketing') marketingNominal = k.nominalDicairkan;
  }

  const potonganPph = (closingNominal + marketingNominal) * (potonganPphPct / 100);
  const totalTransfer = closingNominal + marketingNominal - potonganPph;

  return { closingNominal, marketingNominal, potonganPph, totalTransfer };
};

/** Apakah user boleh uncheck komponen (hanya closing saja di tahap yang mengizinkan) */
export const canSelectClosingOnly = (preview: PencairanAjukanPreview) =>
  preview.komponenSekarang.some((k) => k.key === 'closing') &&
  preview.komponenSekarang.some((k) => k.key === 'marketing');
