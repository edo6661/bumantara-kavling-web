import type { SpkPembayaranData } from '../services/spkPembayaran.service';

export interface SpkPembayaranDokumenItem {
  key: 'invoice' | 'material' | 'ba' | 'progress';
  label: string;
  url: string;
}

export function getSpkPembayaranDokumenItems(
  row: Pick<
    SpkPembayaranData,
    'dokumenInvoice' | 'dokumenMaterial' | 'dokumenBeritaAcara' | 'dokumenProgressSpk'
  >,
): SpkPembayaranDokumenItem[] {
  const items: SpkPembayaranDokumenItem[] = [];
  if (row.dokumenInvoice) {
    items.push({ key: 'invoice', label: 'Invoice', url: row.dokumenInvoice });
  }
  if (row.dokumenMaterial) {
    items.push({ key: 'material', label: 'Material', url: row.dokumenMaterial });
  }
  if (row.dokumenBeritaAcara) {
    items.push({ key: 'ba', label: 'BA', url: row.dokumenBeritaAcara });
  }
  if (row.dokumenProgressSpk) {
    items.push({ key: 'progress', label: 'Progress', url: row.dokumenProgressSpk });
  }
  return items;
}

export function hasSpkPembayaranDokumen(
  row: Pick<
    SpkPembayaranData,
    'dokumenInvoice' | 'dokumenMaterial' | 'dokumenBeritaAcara' | 'dokumenProgressSpk'
  >,
): boolean {
  return getSpkPembayaranDokumenItems(row).length > 0;
}
