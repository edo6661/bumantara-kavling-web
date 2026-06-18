import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData } from '../services/agentPencairan.service';
import {
  calcPotonganPphFromReferensi,
  getPencairanKomponen,
  getTotalFeeReferensi,
  type PencairanKomponenKey,
  type SaleDetail,
} from './agentPencairan';

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
  potonganPph: number;
  totalTransfer: number;
  totalFeeReferensi: number;
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

  const totalFeeReferensi = getTotalFeeReferensi(agent, feeRecord, detail);
  const potonganPph = calcPotonganPphFromReferensi(agent, feeRecord, detail);
  const potonganPphPct = Number(agent.potonganPph) || 0;

  const komponenSekarang: PencairanKomponenPreview[] = komponen
    .filter((k) => k.eligible && k.nominalSisa > 0)
    .map((k) => ({
      key: k.key,
      label: k.label,
      nominalPenuh: k.nominalPenuh,
      nominalDicairkan: k.nominalSisa,
      dicairkanSekarang: true,
      bisaPilih: true,
      alasan: k.alasan,
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
  const totalTransfer = defaultGross - potonganPph;

  const catatanTahap =
    'Pilih komponen yang ingin diajukan. Pot. PPh dihitung dari total fee (+ closing) penuh, ' +
    `bukan hanya komponen terpilih. Rumus: ${formatPct(potonganPphPct)}% × ${formatRupiahShort(totalFeeReferensi)} = ${formatRupiahShort(potonganPph)}.`;

  return {
    komponenSekarang,
    komponenBelum,
    potonganPph,
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
  const totalTransfer = selectedGross - preview.potonganPph;

  return { closingNominal, marketingNominal, potonganPph: preview.potonganPph, totalTransfer };
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
