import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData } from '../services/agentPencairan.service';
import {
  calcGrandTotalTransfer,
  calcPotonganPphDariNominal,
  calcPotonganPphFromReferensi,
  calcPotonganPphUntukPengajuan,
  getClosingFull,
  getClosingGross,
  getClosingPpn,
  getFullMarketingFee,
  getPencairanKomponen,
  getTotalFeeReferensi,
  sumPotonganPphSudahDiajukan,
  type PencairanKomponenKey,
  type SaleDetail,
} from './agentPencairan';
import { PPN_PKP_RATE } from './agentPkpTax';

export type { PencairanKomponenKey };

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
  komponenSekarang: PencairanKomponenPreview[];
  komponenBelum: PencairanKomponenPreview[];
  closingFeeFull: number;
  /** Nominal bruto closing (PKP, incl. PPN) — sama dengan master perusahaan */
  closingFeeGross?: number;
  /** PPN closing (PKP only) — ikut di total transfer */
  closingPpn: number;
  isPkp?: boolean;
  closingPkpHint?: string;
  marketingFeeFull: number;
  /** Total fee = closing fee + marketing fee */
  totalFeeReferensi: number;
  /** Pot. PPh referensi penuh = total fee × % */
  potonganPphTotal: number;
  /** Pot. PPh proporsional untuk komponen default yang diajukan sekarang */
  potonganPph: number;
  potonganPphSudah: number;
  /** Total transfer penuh = total fee (+ PPN PKP) − pot. PPh */
  grandTotalPenuh: number;
  totalTransfer: number;
  potonganPphPct: number;
  catatanTahap: string;
}

export const buildPencairanAjukanPreview = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  pencairanList: AgentPencairanData[],
  detail: SaleDetail | undefined,
): PencairanAjukanPreview | null => {
  const komponen = getPencairanKomponen(agent, feeRecord, pencairanList, detail);
  const eligible = komponen.filter((k) => k.eligible && k.nominalSisa > 0);
  if (eligible.length === 0) return null;

  const isPkp = !!agent.isPkp;
  const closingFeeGross = isPkp ? getClosingGross(agent, feeRecord, detail) : undefined;
  const closingFeeFull = getClosingFull(agent, feeRecord, detail);
  const closingPpn = getClosingPpn(agent, feeRecord, detail);
  const closingPkpHint =
    isPkp && closingFeeGross != null && closingFeeGross > 0
      ? `Agent PKP: closing ${formatRupiahShort(closingFeeFull)} (DPP) + PPN ${formatRupiahShort(closingPpn)} dari bruto ${formatRupiahShort(closingFeeGross)} (PPN ${Math.round(PPN_PKP_RATE * 100)}%). PPh dari DPP; PPN ikut ditransfer.`
      : undefined;
  const marketingFeeFull = getFullMarketingFee(agent, detail);
  const totalFeeReferensi = getTotalFeeReferensi(agent, feeRecord, detail);
  const potonganPphTotal = calcPotonganPphFromReferensi(agent, feeRecord, detail);
  const potonganPph = calcPotonganPphUntukPengajuan(
    agent,
    feeRecord,
    pencairanList,
    detail,
  );
  const potonganPphSudah = sumPotonganPphSudahDiajukan(pencairanList);
  const grandTotalPenuh = calcGrandTotalTransfer(
    totalFeeReferensi,
    potonganPphTotal,
    closingPpn,
  );
  const potonganPphPct = Number(agent.potonganPph) || 0;

  const pkpClosingAlasanSuffix =
    closingPkpHint != null
      ? ` ${closingPkpHint}`
      : '';

  const komponenSekarang: PencairanKomponenPreview[] = komponen
    .filter((k) => k.eligible && k.nominalSisa > 0)
    .map((k) => ({
      key: k.key,
      label: k.key === 'closing' && isPkp ? 'Closing Fee (DPP)' : k.label,
      nominalPenuh: k.nominalPenuh,
      nominalDicairkan: k.nominalSisa,
      dicairkanSekarang: true,
      bisaPilih: true,
      alasan:
        k.key === 'closing' && closingPkpHint
          ? `${k.alasan ?? ''}${pkpClosingAlasanSuffix}`.trim()
          : k.alasan,
    }));

  const komponenBelum: PencairanKomponenPreview[] = komponen
    .filter((k) => !k.eligible || k.nominalSisa <= 0)
    .filter((k) => k.nominalPenuh > 0 || k.key === 'marketing')
    .map((k) => ({
      key: k.key,
      label: k.label,
      nominalPenuh: k.nominalPenuh,
      nominalDicairkan: 0,
      dicairkanSekarang: false,
      bisaPilih: false,
      alasan: k.alasan,
    }));

  const defaultGross = komponenSekarang.reduce((s, k) => s + k.nominalDicairkan, 0);
  const defaultIncludesClosing = komponenSekarang.some((k) => k.key === 'closing');
  // potonganPph sudah dihitung dari portion yang benar-benar disubmit (cash half-aware)
  const totalTransfer =
    defaultGross + (defaultIncludesClosing ? closingPpn : 0) - potonganPph;

  const cairSekaligusHint =
    komponenSekarang.length > 1
      ? ' Jika semua syarat sudah lengkap, closing fee dan komisi marketing bisa diajukan sekaligus dalam satu pengajuan (keduanya tercentang otomatis).'
      : '';

  const transferRumus = isPkp
    ? `Total transfer penuh = DPP + PPN + marketing − pot. PPh = ${formatRupiahShort(grandTotalPenuh)}.`
    : `Total transfer penuh = total fee − pot. PPh = ${formatRupiahShort(grandTotalPenuh)}.`;

  const pphRumus =
    `Pot. PPh dipotong proporsional per pengajuan: (closing + marketing yang dicairkan) × ${formatPct(potonganPphPct)}%. ` +
    `Referensi penuh penjualan: ${formatRupiahShort(potonganPphTotal)}. ` +
    transferRumus;

  const pphCatatan =
    potonganPphSudah > 0
      ? ` Sudah dipotong PPh ${formatRupiahShort(potonganPphSudah)} pada pengajuan sebelumnya. Pengajuan ini memotong PPh ${formatRupiahShort(potonganPph)} dari komponen yang dipilih.`
      : ` ${pphRumus}`;

  const catatanTahap =
    'Pilih komponen yang ingin diajukan.' +
    cairSekaligusHint +
    pphCatatan;

  return {
    komponenSekarang,
    komponenBelum,
    closingFeeFull,
    closingFeeGross,
    closingPpn,
    isPkp,
    closingPkpHint,
    marketingFeeFull,
    potonganPphTotal,
    potonganPph,
    potonganPphSudah,
    grandTotalPenuh,
    totalTransfer,
    totalFeeReferensi,
    potonganPphPct,
    catatanTahap,
  };
};

export const calcSelectedPencairanTotal = (
  preview: PencairanAjukanPreview,
  selected: Set<PencairanKomponenKey>,
) => {
  let closingNominal = 0;
  let marketingNominal = 0;

  for (const k of preview.komponenSekarang) {
    if (!selected.has(k.key)) continue;
    if (k.key === 'closing') closingNominal = k.nominalDicairkan;
    if (k.key === 'marketing') marketingNominal = k.nominalDicairkan;
  }

  const selectedGross = closingNominal + marketingNominal;
  const closingPpn = selected.has('closing') ? preview.closingPpn : 0;
  const potonganPph = calcPotonganPphDariNominal(
    selectedGross,
    preview.potonganPphPct,
  );
  const totalTransfer = selectedGross + closingPpn - potonganPph;

  return {
    closingNominal,
    marketingNominal,
    closingPpn,
    potonganPph,
    totalTransfer,
  };
};

function formatRupiahShort(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}
