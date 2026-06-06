import type { SpkPembayaranKasbonBarisData } from '../services/spkPembayaran.service';
import { formatDate } from './formatters';

export const KASBON_NAMA_SUPPLIER_DEFAULT = '-';

export const normalizeMaterialNamaSupplier = (value: string) => {
  const trimmed = value.trim();
  return trimmed || KASBON_NAMA_SUPPLIER_DEFAULT;
};

export const kasbonSupplierDisplayName = (nama: string) =>
  nama === KASBON_NAMA_SUPPLIER_DEFAULT ? '-' : nama;

export const toKasbonDateIso = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0]!;
};

export type KasbonDisplayItem = { id: number; keterangan: string; nominal: number };

export type KasbonDisplayBon = {
  tanggalPo: string;
  tanggalIso: string;
  fotoBon: string | null;
  items: KasbonDisplayItem[];
  subtotal: number;
};

export type KasbonDisplaySupplier = {
  namaSupplier: string;
  bons: KasbonDisplayBon[];
  total: number;
};

export const groupKasbonBarisForDisplay = (
  baris: SpkPembayaranKasbonBarisData[],
): KasbonDisplaySupplier[] => {
  const supplierMap = new Map<string, KasbonDisplaySupplier>();

  for (const b of baris) {
    const nama = normalizeMaterialNamaSupplier(b.namaSupplier || '');
    let supplier = supplierMap.get(nama);
    if (!supplier) {
      supplier = { namaSupplier: nama, bons: [], total: 0 };
      supplierMap.set(nama, supplier);
    }

    const tanggalIso = toKasbonDateIso(b.tanggalPo);
    const foto = b.fotoBon ?? '';
    const bonKey = `${tanggalIso}\0${foto}`;
    let bon = supplier.bons.find((x) => `${x.tanggalIso}\0${x.fotoBon ?? ''}` === bonKey);
    if (!bon) {
      bon = {
        tanggalPo: b.tanggalPo,
        tanggalIso,
        fotoBon: b.fotoBon,
        items: [],
        subtotal: 0,
      };
      supplier.bons.push(bon);
    }

    bon.items.push({
      id: b.id,
      keterangan: b.keterangan,
      nominal: b.nominal,
    });
    bon.subtotal += b.nominal;
    supplier.total += b.nominal;
  }

  return Array.from(supplierMap.values());
};

export const kasbonTanggalPoSummary = (baris: SpkPembayaranKasbonBarisData[]) => {
  const isoDays = [...new Set(baris.map((b) => toKasbonDateIso(b.tanggalPo)))].filter(Boolean).sort();
  if (isoDays.length === 0) return { label: '—', title: undefined as string | undefined };
  if (isoDays.length === 1) {
    return { label: formatDate(isoDays[0]!), title: undefined };
  }
  const title = isoDays.map((d) => formatDate(d)).join(', ');
  return {
    label: `${formatDate(isoDays[0]!)} – ${formatDate(isoDays[isoDays.length - 1]!)}`,
    title,
  };
};
