export type BankKprPembayaranJenis = 'BIAYA_KPR' | 'BIAYA_APPRAISAL';
export type BankKprPembayaranStatus = 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR';

export const BANK_KPR_PEMBAYARAN_JENIS_LABEL: Record<BankKprPembayaranJenis, string> = {
  BIAYA_KPR: 'Biaya KPR',
  BIAYA_APPRAISAL: 'Biaya Appraisal',
};

export const BANK_KPR_JENIS_UI_COLOR: Record<
  BankKprPembayaranJenis,
  { badge: string; row: string; text: string }
> = {
  BIAYA_KPR: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    row: 'bg-blue-50/40',
    text: 'text-blue-900',
  },
  BIAYA_APPRAISAL: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    row: 'bg-amber-50/40',
    text: 'text-amber-900',
  },
};

export const formatKavlingLabel = (blok: string, nomorUnit: string) =>
  `Blok ${blok} - No. ${nomorUnit}`;

export const getBankKprDisplayName = (penjualan: {
  bank?: string | null;
  bankKprNamaRekening?: string | null;
}) => penjualan.bankKprNamaRekening?.trim() || penjualan.bank?.trim() || null;
