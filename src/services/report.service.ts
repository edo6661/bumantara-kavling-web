import api from "../lib/axios";

export type SpkPembayaranStatusFilter =
  | "DRAFT"
  | "MENUNGGU_PERSETUJUAN"
  | "MENUNGGU_PEMBAYARAN"
  | "SUDAH_DIBAYAR"
  | "ALL";

export interface BiayaProyekReportParams {
  perumahanId?: number;
  spkId?: number;
  blok?: string;
  startDate?: string;
  endDate?: string;
  pembayaranStatus?: SpkPembayaranStatusFilter;
}

export interface BiayaProyekKasbonBaris {
  id: number;
  namaSupplier: string;
  keterangan: string | null;
  tanggalPo: string;
  nominal: number;
}

export interface BiayaProyekUpahBaris {
  id: number;
  nik: string;
  nama: string;
  nominal: number;
}

export interface BiayaProyekPembayaran {
  id: number;
  jenis: string;
  jenisLabel: string;
  nominal: number;
  status: string;
  keterangan: string | null;
  tanggalPembayaran: string | null;
  tanggalPo: string | null;
  tanggalDari: string | null;
  tanggalSampai: string | null;
  kasbonBaris: BiayaProyekKasbonBaris[];
  upahBaris: BiayaProyekUpahBaris[];
}

export interface BiayaProyekSpkItem {
  spkId: number;
  noSpk: string;
  judulPekerjaan: string;
  nilaiKontrak: number;
  nilaiSudahDibayarkan: number;
  sisaNilaiKontrak: number;
  mandor: { id: number; username: string };
  kavlingUnits: {
    kavlingId: number;
    blok: string;
    nomorUnit: string;
    perumahanId: number;
    perumahanNama: string;
  }[];
  pembayaran: BiayaProyekPembayaran[];
  totalPembayaran: number;
  totalKasbon: number;
  totalUpah: number;
}

export interface BiayaProyekReportData {
  filters: BiayaProyekReportParams;
  summary: {
    jumlahSpk: number;
    totalNilaiKontrak: number;
    totalSudahDibayar: number;
    totalSisa: number;
    byJenis: Record<string, number>;
    totalKasbon: number;
    totalUpah: number;
  };
  items: BiayaProyekSpkItem[];
  bySupplier: {
    namaSupplier: string;
    jumlahTransaksi: number;
    totalNominal: number;
  }[];
  byTukang: {
    nik: string;
    nama: string;
    jumlahTransaksi: number;
    totalNominal: number;
  }[];
}

export interface ProgressProyekReportParams {
  perumahanId?: number;
  spkId?: number;
  blok?: string;
  mandorId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProgressProyekTahapan {
  id: number;
  namaTahapan: string;
  persentase: number;
  deskripsi: string | null;
  tanggal: string;
  reportedBy: string | null;
}

export interface ProgressProyekUnitItem {
  kavlingId: number;
  blok: string;
  nomorUnit: string;
  perumahanId: number;
  perumahanNama: string;
  customerNama: string;
  penjualanStatus: string;
  spkId: number | null;
  noSpk: string | null;
  judulPekerjaan: string | null;
  mandor: { id: number; username: string } | null;
  progress: number;
  tahapTerakhir: string;
  isLate: boolean;
  jumlahTahapan: number;
  tahapan: ProgressProyekTahapan[];
}

export interface ProgressProyekReportData {
  filters: ProgressProyekReportParams;
  summary: {
    totalUnit: number;
    rataRataProgress: number;
    unitSelesai: number;
    unitProses: number;
    unitBelumMulai: number;
    unitTerlambat: number;
  };
  byBlok: {
    blok: string;
    totalUnit: number;
    rataRataProgress: number;
    selesai: number;
    proses: number;
    belumMulai: number;
  }[];
  bySpk: {
    spkId: number;
    noSpk: string;
    judulPekerjaan: string;
    mandor: { id: number; username: string };
    totalUnit: number;
    rataRataProgress: number;
    selesai: number;
    proses: number;
  }[];
  items: ProgressProyekUnitItem[];
}

export interface PenjualanReportParams {
  perumahanId?: number;
  blok?: string;
  status?: string;
  caraPembayaran?: string;
  agentId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PenjualanReportTagihan {
  id: number;
  noTagihan: string;
  nominal: number;
  jatuhTempo: string;
  status: string;
  tujuan: string;
  tujuanLabel: string;
  hariTerlambat: number;
}

export interface PenjualanReportItem {
  penjualanId: number;
  noTransaksi: string;
  tanggal: string;
  status: string;
  caraPembayaran: string | null;
  hargaJual: number;
  customerNama: string;
  agentNama: string | null;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  totalTagihan: number;
  totalTerbayar: number;
  totalPiutang: number;
  persentaseTerbayar: number;
  jumlahTagihanLunas: number;
  jumlahTagihanBelum: number;
  tagihan: PenjualanReportTagihan[];
}

export interface RekapPembayaranReportParams {
  perumahanId?: number;
  blok?: string;
  status?: string;
  caraPembayaran?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RekapPembayaranBucket {
  utama: number;
  terbayar: number[];
}

export interface RekapPembayaranPemasukan {
  booking: RekapPembayaranBucket;
  dp: RekapPembayaranBucket;
  cicilanCashBertahap: RekapPembayaranBucket;
  cicilanPencairanKpr: RekapPembayaranBucket;
}

export interface RekapPembayaranPengeluaranNotaris {
  biayaNotaris: RekapPembayaranBucket;
  bphtb: RekapPembayaranBucket;
  pph: RekapPembayaranBucket;
}

export interface RekapPembayaranPengeluaranBank {
  biayaKpr: RekapPembayaranBucket;
  biayaAppraisal: RekapPembayaranBucket;
}

export interface RekapPembayaranPengeluaranProyek {
  material: RekapPembayaranBucket;
  upah: RekapPembayaranBucket;
}

export interface RekapPembayaranMarketing {
  marketingFee: RekapPembayaranBucket;
  closingFee: RekapPembayaranBucket;
  netSetelahPotonganPph: RekapPembayaranBucket;
  potonganPph: RekapPembayaranBucket;
}

export interface RekapPembayaranReportItem {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  hargaJual: number;
  dp: number;
  sisaPembayaran: number;
  dpTerbayar: number[];
  cicilanTerbayar: number[];
  totalDpTerbayar: number;
  totalCicilanTerbayar: number;
  pemasukan: RekapPembayaranPemasukan;
  pengeluaranNotaris: RekapPembayaranPengeluaranNotaris;
  pengeluaranBank: RekapPembayaranPengeluaranBank;
  pengeluaranProyek: RekapPembayaranPengeluaranProyek;
  marketing: RekapPembayaranMarketing;
}

export interface RekapPembayaranReportData {
  filters: RekapPembayaranReportParams;
  summary: {
    jumlahPenjualan: number;
    totalHargaJual: number;
    totalDp: number;
    totalSisaPembayaran: number;
    totalDpTerbayar: number;
    totalCicilanTerbayar: number;
  };
  items: RekapPembayaranReportItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PemasukanPenjualanReportParams {
  perumahanId?: number;
  blok?: string;
  status?: string;
  caraPembayaran?: string;
  skemaPembayaran?: 'Bertahap' | 'KPR';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PemasukanTerbayarDetail {
  tagihanId: number;
  noTagihan: string;
  nominal: number;
  pembayaran: string;
  jatuhTempo: string;
  status: string;
  fileBukti: string | null;
  fileBuktiList: string[];
  updatedAt: string;
}

export interface PemasukanPenjualanBucket {
  nominal: number;
  terbayar: PemasukanTerbayarDetail[];
  totalTerbayar: number;
  sisa: number;
}

export interface PemasukanPenjualanCicilan extends PemasukanPenjualanBucket {
  skemaPembayaran: string | null;
}

export interface PemasukanPenjualanReportItem {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  blok: string;
  nomorUnit: string;
  perumahanNama: string;
  caraPembayaran: string | null;
  hargaJual: number;
  bookingLunas: boolean | null;
  dp: PemasukanPenjualanBucket;
  cicilan: PemasukanPenjualanCicilan;
}

export interface PemasukanPenjualanReportData {
  filters: PemasukanPenjualanReportParams;
  summary: {
    jumlahPenjualan: number;
    totalBookingNominal: number;
    totalBookingTerbayar: number;
    totalDpNominal: number;
    totalDpTerbayar: number;
    totalCicilanNominal: number;
    totalCicilanTerbayar: number;
  };
  items: PemasukanPenjualanReportItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface RekapPemasukanReportParams {
  perumahanId?: number;
  blok?: string;
  status?: string;
  caraPembayaran?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RekapPemasukanKategori {
  key: string;
  label: string;
  terbayar: number | null;
  calculable: boolean;
  note?: string;
}

export type RekapPemasukanKategoriKey =
  | 'bookingFee'
  | 'dp'
  | 'cicilanDp'
  | 'pencairanKpr'
  | 'cicilanCashBertahap'
  | 'dpKpr'
  | 'cicilanRumah'
  | 'dpCashBertahap';

export interface RekapPemasukanTerbayarBuckets {
  bookingFee: PemasukanTerbayarDetail[];
  dp: PemasukanTerbayarDetail[];
  cicilanCashBertahap: PemasukanTerbayarDetail[];
  cicilanDp: PemasukanTerbayarDetail[];
  cicilanRumah: PemasukanTerbayarDetail[];
  dpKpr: PemasukanTerbayarDetail[];
  cicilanKpr: PemasukanTerbayarDetail[];
}

export interface RekapPemasukanTerbayarDetail extends PemasukanTerbayarDetail {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
}

export interface RekapPemasukanSkema {
  dp: RekapPemasukanKategori;
  cicilan: RekapPemasukanKategori;
  cicilanDp?: RekapPemasukanKategori;
  cicilanRumah?: RekapPemasukanKategori;
}

export interface RekapPemasukanDetailItem {
  penjualanId: number;
  noTransaksi: string;
  customerNama: string;
  kavlingLabel: string;
  caraPembayaran: string | null;
  pembiayaan: string | null;
  bookingFee: number;
  dp: number;
  cicilanCashBertahap: number;
  cicilanDp: number;
  cicilanRumah: number;
  dpKpr: number;
  cicilanKpr: number;
  totalTerima: number;
  terbayar: RekapPemasukanTerbayarBuckets;
}

export interface RekapPemasukanReportData {
  filters: RekapPemasukanReportParams;
  ringkasan: RekapPemasukanKategori[];
  kpr: RekapPemasukanSkema;
  cashBertahap: RekapPemasukanSkema;
  totalTerima: number;
  jumlahPenjualan: number;
  kategoriTerbayar: Partial<Record<RekapPemasukanKategoriKey, RekapPemasukanTerbayarDetail[]>>;
  items: RekapPemasukanDetailItem[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PenjualanReportData {
  filters: PenjualanReportParams;
  summary: {
    jumlahPenjualan: number;
    totalNilaiPenjualan: number;
    totalTerbayar: number;
    totalPiutang: number;
    tagihanJatuhTempo: number;
    tagihanMenungguKonfirmasi: number;
    persentaseKoleksi: number;
  };
  aging: {
    bucket: string;
    label: string;
    jumlahTagihan: number;
    totalNominal: number;
  }[];
  byStatus: { status: string; label: string; count: number; nominal: number }[];
  byBlok: { blok: string; count: number; nominal: number }[];
  items: PenjualanReportItem[];
}

export const reportService = {
  getBiayaProyek: async (
    params: BiayaProyekReportParams = {},
  ): Promise<BiayaProyekReportData> => {
    const response = await api.get("/reports/biaya-proyek", { params });
    return response.data.data;
  },

  getProgressProyek: async (
    params: ProgressProyekReportParams = {},
  ): Promise<ProgressProyekReportData> => {
    const response = await api.get("/reports/progress-proyek", { params });
    return response.data.data;
  },

  getPenjualan: async (
    params: PenjualanReportParams = {},
  ): Promise<PenjualanReportData> => {
    const response = await api.get("/reports/penjualan", { params });
    return response.data.data;
  },

  getRekapPembayaran: async (
    params: RekapPembayaranReportParams = {},
  ): Promise<RekapPembayaranReportData> => {
    const response = await api.get("/reports/rekap-pembayaran", { params });
    return response.data.data;
  },

  getPemasukanPenjualan: async (
    params: PemasukanPenjualanReportParams = {},
  ): Promise<PemasukanPenjualanReportData> => {
    const response = await api.get("/reports/pemasukan-penjualan", { params });
    return response.data.data;
  },

  getRekapPemasukan: async (
    params: RekapPemasukanReportParams = {},
  ): Promise<RekapPemasukanReportData> => {
    const response = await api.get("/reports/rekap-pemasukan", { params });
    return response.data.data;
  },

  getKeuangan: async (
    params: KeuanganReportParams = {},
  ): Promise<KeuanganReportData> => {
    const response = await api.get("/reports/keuangan", { params });
    return response.data.data;
  },

  getMarketing: async (
    params: MarketingReportParams = {},
  ): Promise<MarketingReportData> => {
    const response = await api.get("/reports/marketing", { params });
    return response.data.data;
  },

  exportMarketingExcel: async (
    params: MarketingReportParams = {},
  ): Promise<void> => {
    const response = await api.get("/reports/marketing/export/excel", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fallback = `Laporan_Marketing_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const disposition = response.headers["content-disposition"] as
      | string
      | undefined;
    const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
    const plainMatch = disposition?.match(/filename="?([^";]+)"?/i);
    const filename = utf8Match?.[1]
      ? decodeURIComponent(utf8Match[1].replace(/"/g, ""))
      : plainMatch?.[1]?.trim() || fallback;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

export interface MarketingReportParams {
  startDate?: string;
  endDate?: string;
  agentId?: number;
  perusahaanAgentId?: number;
  perumahanId?: number;
}

export interface MarketingReportData {
  filters: MarketingReportParams;
  summary: {
    totalKavling: number;
    kavlingTerjual: number;
    jumlahPenjualan: number;
    penjualanPeriode: number;
    totalAgentAktif: number;
    totalFeeBooking: number;
    totalFeeClosing: number;
    totalFeeMarketing: number;
    feeBookingSudahDibayar: number;
    feeClosingSudahDibayar: number;
    feeMarketingSudahDibayar: number;
    feeBelumDibayar: number;
  };
  byStatus: { status: string; label: string; count: number }[];
  penjualanBulanan: {
    bulan: string;
    bulanLabel: string;
    count: number;
    nominal: number;
  }[];
  byAgent: {
    agentId: number;
    nama: string;
    perusahaanNama: string | null;
    booked: number;
    proses: number;
    lunas: number;
    batal: number;
    totalClosing: number;
    konversiRate: number;
    totalFeeBooking: number;
    totalFeeClosing: number;
    totalFeeMarketing: number;
    feeSudahDibayar: number;
    feeBelumDibayar: number;
  }[];
  byPerusahaan: {
    perusahaanAgentId: number;
    nama: string;
    jumlahAgent: number;
    totalClosing: number;
    totalFee: number;
    feeSudahDibayar: number;
  }[];
  feeItems: {
    feeId: number;
    penjualanId: number;
    noTransaksi: string;
    tanggal: string;
    penjualanStatus: string;
    customerNama: string;
    kavlingLabel: string;
    agentNama: string;
    bookingNominal: number;
    bookingSudahDibayar: boolean;
    closingNominal: number;
    closingSudahDibayar: boolean;
    marketingNominal: number;
    marketingSudahDibayar: boolean;
    totalFee: number;
  }[];
}

export interface KeuanganReportParams {
  startDate?: string;
  endDate?: string;
  kategori?: string;
  bsiCms?: string;
  status?: string;
}

export interface KeuanganReportData {
  filters: KeuanganReportParams;
  summary: {
    totalMasuk: number;
    totalKeluar: number;
    totalMenungguKeluar: number;
    spkKeluar: number;
    notarisKeluar: number;
    kprKeluar: number;
    bsiCmsSudahDilaporkan: number;
    bsiCmsBelumDilaporkan: number;
    arusKasBersih: number;
  };
  arusKasBulanan: {
    bulan: string;
    bulanLabel: string;
    masuk: number;
    keluar: number;
  }[];
  byKategori: {
    kategori: string;
    label: string;
    sudahDibayar: number;
    menungguPembayaran: number;
    bsiBelumDilaporkan: number;
  }[];
  pengeluaran: {
    id: number;
    kategori: string;
    jenis: string;
    jenisLabel: string;
    nominal: number;
    status: string;
    tanggalPembayaran: string | null;
    bsiCmsDilaporkan: boolean;
    referensi: string;
    sublabel: string | null;
  }[];
  pemasukan: {
    id: number;
    kategori: string;
    noTagihan: string;
    nominal: number;
    tujuan: string;
    tujuanLabel: string;
    tanggalLunas: string;
    customerNama: string;
    kavlingLabel: string;
  }[];
}
