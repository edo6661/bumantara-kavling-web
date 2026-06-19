import type { PicAgentData } from '../../types/models/agent';

export interface AgentFormState {
  id: number | '';
  nik: string;
  nama: string;
  alamat: string;
  noHp: string;
  email: string;
  type: string;
  perusahaanAgentId: number | '';
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  feeMarketingPct: number | '';
  feeClosingNominal: number | '';
  potonganPph: number | '';
  isPkp: boolean;
  pics: PicAgentData[];
}

export type AgentTypeFilter = 'PRIBADI' | 'PERUSAHAAN';

export interface UseAgentCrudOptions {
  defaultAgentType: AgentTypeFilter;
  /** Sembunyikan selector tipe & kunci ke defaultAgentType */
  lockAgentType?: boolean;
}
