import type { AgentData } from '../types/models/agent';
import type { PerusahaanAgentData } from '../services/perusahaanAgent.service';

export function isAgentPerusahaan(type?: string | null) {
  return type === 'PERUSAHAAN';
}

type AgentCommercialFields = Pick<
  AgentData,
  | 'feeMarketingPct'
  | 'feeClosingNominal'
  | 'potonganPph'
  | 'isPkp'
  | 'namaBank'
  | 'noRekening'
  | 'atasNamaRekening'
>;

/** Agent perusahaan: fee, PPh, dan rekening mengikuti master perusahaan */
export function applyPerusahaanCommercialToAgent<T extends AgentCommercialFields>(
  agent: T,
  perusahaan?: PerusahaanAgentData | null,
): T {
  if (!perusahaan) return agent;
  return {
    ...agent,
    feeMarketingPct: perusahaan.feeMarketingPct ?? null,
    feeClosingNominal: perusahaan.feeClosingNominal ?? null,
    potonganPph: perusahaan.potonganPph ?? null,
    isPkp: perusahaan.isPkp ?? false,
    namaBank: perusahaan.namaBank ?? null,
    noRekening: perusahaan.noRekening ?? null,
    atasNamaRekening: perusahaan.atasNamaRekening ?? null,
  };
}

export function getPerusahaanById(
  perusahaanList: PerusahaanAgentData[],
  id: number | string | '',
) {
  if (id === '' || id == null) return null;
  return perusahaanList.find((p) => p.id === Number(id)) ?? null;
}

/** Fee & rekening untuk kalkulasi pencairan — agent perusahaan ikut master perusahaan */
export function resolveAgentForPencairan<T extends AgentCommercialFields & { type?: string; perusahaanAgent?: { id: number } | null }>(
  agent: T,
  perusahaanList: PerusahaanAgentData[],
): T {
  if (!isAgentPerusahaan(agent.type) || !agent.perusahaanAgent?.id) return agent;
  return applyPerusahaanCommercialToAgent(
    agent,
    getPerusahaanById(perusahaanList, agent.perusahaanAgent.id),
  );
}
