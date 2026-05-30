export type NotarisPembayaranJenis = 'BIAYA_NOTARIS' | 'BPHTB';
export type NotarisPembayaranStatus = 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR';

export const NOTARIS_PEMBAYARAN_JENIS_LABEL: Record<NotarisPembayaranJenis, string> = {
  BIAYA_NOTARIS: 'Biaya Notaris',
  BPHTB: 'BPHTB',
};

export const NOTARIS_JENIS_UI_COLOR: Record<
  NotarisPembayaranJenis,
  { badge: string; row: string; text: string }
> = {
  BIAYA_NOTARIS: {
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    row: 'bg-violet-50/40',
    text: 'text-violet-900',
  },
  BPHTB: {
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    row: 'bg-teal-50/40',
    text: 'text-teal-900',
  },
};

export const formatKavlingLabel = (blok: string, nomorUnit: string) =>
  `Blok ${blok} - No. ${nomorUnit}`;
