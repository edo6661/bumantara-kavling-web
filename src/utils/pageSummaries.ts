import type { CustomerData } from '../services/customer.service';
import type { AgentData } from '../types/models/agent';
import type { PerusahaanAgentData } from '../services/perusahaanAgent.service';
import type { TagihanData } from '../services/tagihan.service';
import type { AgentPencairanData } from '../services/agentPencairan.service';
import {
  isAllProgressFileAjbComplete,
  isAllProgressFilePpjbComplete,
  isAllTanahSertifikatComplete,
  type ProgressPenjualanLike,
} from './progressPenjualanSertifikat';
import { summarizePencairanHistory } from './agentPencairan';
import { formatRupiah } from './formatters';

export const CUSTOMER_PLACEHOLDER_NIK_PREFIXES = ['DUMMY-', 'IMP-'] as const;
export const AGENT_PLACEHOLDER_NIK_PREFIXES = ['MKT-', 'IMP-'] as const;

export function hasPlaceholderNik(
  nik: string | null | undefined,
  prefixes: readonly string[],
): boolean {
  const normalized = (nik ?? '').trim().toUpperCase();
  if (!normalized) return true;
  return prefixes.some((prefix) => normalized.startsWith(prefix.toUpperCase()));
}

export function isCustomerDataIncomplete(customer: CustomerData): boolean {
  if (hasPlaceholderNik(customer.nikKtp, CUSTOMER_PLACEHOLDER_NIK_PREFIXES)) return true;
  if ((customer.nikKtp ?? '').trim().length !== 16) return true;
  if (!(customer.nama ?? '').trim()) return true;
  if (!(customer.noHp ?? '').trim()) return true;
  if (!(customer.alamatKtp ?? '').trim()) return true;
  if (!(customer.email ?? '').trim()) return true;
  if (!customer.fileKtp?.trim()) return true;
  if (!customer.fileKk?.trim()) return true;
  if (!customer.fileNpwp?.trim()) return true;
  return false;
}

export function summarizeCustomerAdministrasi(
  customers: CustomerData[],
  totalItems?: number,
) {
  let placeholderNik = 0;
  let incompleteData = 0;
  let missingDocuments = 0;
  let hasAccount = 0;

  for (const customer of customers) {
    if (hasPlaceholderNik(customer.nikKtp, CUSTOMER_PLACEHOLDER_NIK_PREFIXES)) {
      placeholderNik += 1;
    }
    if (isCustomerDataIncomplete(customer)) incompleteData += 1;
    if (!customer.fileKtp?.trim() || !customer.fileKk?.trim() || !customer.fileNpwp?.trim()) {
      missingDocuments += 1;
    }
    if (customer.hasAccount) hasAccount += 1;
  }

  return {
    total: totalItems ?? customers.length,
    placeholderNik,
    incompleteData,
    missingDocuments,
    hasAccount,
    completeData: Math.max(0, customers.length - incompleteData),
  };
}

export function isAgentDataIncomplete(agent: AgentData): boolean {
  if (hasPlaceholderNik(agent.nik, AGENT_PLACEHOLDER_NIK_PREFIXES)) return true;
  if ((agent.nik ?? '').trim().length < 10) return true;
  if (!(agent.nama ?? '').trim()) return true;
  if (!(agent.noHp ?? '').trim()) return true;
  if (!(agent.alamat ?? '').trim()) return true;
  if (!(agent.namaBank ?? '').trim()) return true;
  if (!(agent.noRekening ?? '').trim()) return true;
  if (!(agent.atasNamaRekening ?? '').trim()) return true;
  if (!agent.fileKtp?.trim()) return true;
  if (!agent.fileNpwp?.trim()) return true;
  if (agent.type === 'PERUSAHAAN' && !agent.perusahaanAgentId) return true;
  return false;
}

export function summarizeAgents(agents: AgentData[], totalItems?: number) {
  let placeholderNik = 0;
  let incompleteData = 0;
  let missingBank = 0;
  let activeCount = 0;

  for (const agent of agents) {
    if (hasPlaceholderNik(agent.nik, AGENT_PLACEHOLDER_NIK_PREFIXES)) placeholderNik += 1;
    if (isAgentDataIncomplete(agent)) incompleteData += 1;
    if (
      !(agent.namaBank ?? '').trim() ||
      !(agent.noRekening ?? '').trim() ||
      !(agent.atasNamaRekening ?? '').trim()
    ) {
      missingBank += 1;
    }
    if ((agent.status ?? '').toUpperCase() === 'AKTIF') activeCount += 1;
  }

  return {
    total: totalItems ?? agents.length,
    placeholderNik,
    incompleteData,
    missingBank,
    activeCount,
    completeData: Math.max(0, agents.length - incompleteData),
  };
}

export function summarizePerusahaanAgents(perusahaanList: PerusahaanAgentData[]) {
  let missingNpwp = 0;
  let missingRekening = 0;
  let missingAkte = 0;
  let missingFee = 0;

  for (const row of perusahaanList) {
    if (!(row.npwp ?? '').trim()) missingNpwp += 1;
    if (
      !(row.namaBank ?? '').trim() ||
      !(row.noRekening ?? '').trim() ||
      !(row.atasNamaRekening ?? '').trim()
    ) {
      missingRekening += 1;
    }
    if (!row.akte?.trim()) missingAkte += 1;
    if (row.feeMarketingPct == null && row.feeClosingNominal == null) missingFee += 1;
  }

  return {
    total: perusahaanList.length,
    missingNpwp,
    missingRekening,
    missingAkte,
    missingFee,
  };
}

export function summarizeTagihans(tagihans: TagihanData[]) {
  let belumBayar = 0;
  let menungguKonfirmasi = 0;
  let lunas = 0;
  let jatuhTempoLewat = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const row of tagihans) {
    const status = (row.status ?? '').toUpperCase();
    if (status === 'BELUM_BAYAR') belumBayar += 1;
    else if (status === 'MENUNGGU_KONFIRMASI') menungguKonfirmasi += 1;
    else if (status === 'LUNAS') lunas += 1;

    if (status !== 'LUNAS' && row.jatuhTempo) {
      const due = new Date(row.jatuhTempo);
      due.setHours(0, 0, 0, 0);
      if (due < today) jatuhTempoLewat += 1;
    }
  }

  return {
    total: tagihans.length,
    belumBayar,
    menungguKonfirmasi,
    lunas,
    jatuhTempoLewat,
  };
}

export interface ProgressPenjualanRowLike {
  jumlahSertifikatTanah?: number | null;
  progressPenjualan?: ProgressPenjualanLike | null;
  filePbg?: string | null;
  fileSertifikatTanah?: string | null;
  fileNopPbb?: string | null;
  sertifikatTanahTambahan?: Array<{
    urutan: number;
    filePbg?: string | null;
    fileSertifikatTanah?: string | null;
    fileNopPbb?: string | null;
  }>;
}

export function summarizeProgressPenjualan(rows: ProgressPenjualanRowLike[], totalItems?: number) {
  let ppjbIncomplete = 0;
  let ajbIncomplete = 0;
  let sertifikatIncomplete = 0;
  let sp3kIncomplete = 0;

  for (const row of rows) {
    const jumlahTanah = Math.max(1, Number(row.jumlahSertifikatTanah ?? 1));
    const progress = row.progressPenjualan;

    if (!isAllProgressFilePpjbComplete(jumlahTanah, progress)) ppjbIncomplete += 1;
    if (!isAllProgressFileAjbComplete(jumlahTanah, progress)) ajbIncomplete += 1;
    if (!isAllTanahSertifikatComplete(jumlahTanah, row)) sertifikatIncomplete += 1;
    if (!progress?.fileSp3k?.trim()) sp3kIncomplete += 1;
  }

  const total = totalItems ?? rows.length;
  const fullyComplete = rows.filter((row) => {
    const jumlahTanah = Math.max(1, Number(row.jumlahSertifikatTanah ?? 1));
    const progress = row.progressPenjualan;
    return (
      isAllProgressFilePpjbComplete(jumlahTanah, progress) &&
      isAllProgressFileAjbComplete(jumlahTanah, progress) &&
      isAllTanahSertifikatComplete(jumlahTanah, row) &&
      !!progress?.fileSp3k?.trim()
    );
  }).length;

  return {
    total,
    ppjbIncomplete,
    ajbIncomplete,
    sertifikatIncomplete,
    sp3kIncomplete,
    fullyComplete,
  };
}

export function summarizeByStatus<T extends Record<string, unknown>>(
  items: T[],
  statusKey: keyof T,
  statusLabels?: Record<string, string>,
) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const raw = String(item[statusKey] ?? 'UNKNOWN');
    counts[raw] = (counts[raw] ?? 0) + 1;
  }
  return {
    total: items.length,
    counts,
    statusLabels,
  };
}

export function summarizePencairanAll(records: AgentPencairanData[]) {
  const summary = summarizePencairanHistory(records);
  const uniqueAgents = new Set(records.map((r) => r.agentId)).size;
  return {
    ...summary,
    uniqueAgents,
    totalNominalMenungguFormatted: formatRupiah(summary.totalNominalMenunggu),
    totalNominalTerbayarFormatted: formatRupiah(summary.totalNominalTerbayar),
  };
}

export function countByField<T>(
  items: T[],
  predicate: (item: T) => boolean,
): number {
  return items.reduce((acc, item) => (predicate(item) ? acc + 1 : acc), 0);
}

export function summarizePaymentQueue<T extends { status?: string | null }>(
  items: T[],
  waitingStatus: string,
  paidStatus: string,
) {
  let menunggu = 0;
  let sudahBayar = 0;
  for (const row of items) {
    const status = (row.status ?? '').toUpperCase();
    if (status === waitingStatus.toUpperCase()) menunggu += 1;
    else if (status === paidStatus.toUpperCase()) sudahBayar += 1;
  }
  return {
    total: items.length,
    menunggu,
    sudahBayar,
  };
}
