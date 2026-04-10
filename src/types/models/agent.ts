export interface PicAgentData {
  id?: number;
  nama: string;
  noHp: string;
  alamat?: string;
}

export interface PenjualanAgentData {
  id: number;
  noTransaksi: string;
  tanggal: string;
  hargaJual: number;
  status: string;
  customer?: { nama: string };
  kavling?: {
    blok: string;
    nomorUnit: string;
    perumahan?: { nama: string };
  };
}

export interface AgentData {
  id: number;
  nik: string;
  kodeSales: string | null;
  nama: string;
  alamat: string | null;
  noHp: string;
  email: string | null;
  status: string;
  pics: PicAgentData[];
  penjualan?: PenjualanAgentData[];
}

export interface CreateAgentDTO {
  nik: string;
  nama: string;
  alamat?: string;
  noHp: string;
  email?: string;
  status?: string;
  pics?: PicAgentData[];
}
