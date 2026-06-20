export type PekerjaanInfraKategori = 'SALURAN' | 'JALAN' | 'LAINNYA';

import type { LucideIcon } from 'lucide-react';
import {
  Shovel,
  Cylinder,
  Mountain,
  AlignJustify,
  Pickaxe,
  Truck,
  Layers,
  Construction,
  Route,
  Box,
  Square,
  Grid3x3,
  Boxes,
  Hammer,
  Paintbrush,
  Scissors,
  Droplets,
  Wrench,
} from 'lucide-react';

export const PEKERJAAN_INFRA_KATEGORI_LABEL: Record<PekerjaanInfraKategori, string> = {
  SALURAN: 'Pek Saluran',
  JALAN: 'Pek Jalan',
  LAINNYA: 'Lainnya',
};

export const PEKERJAAN_INFRA_KATEGORI_ORDER: PekerjaanInfraKategori[] = [
  'SALURAN',
  'JALAN',
  'LAINNYA',
];

export interface PekerjaanWithKategori {
  id: number;
  nama: string;
  kategori: PekerjaanInfraKategori;
  urutan: number;
}

export function groupByKategori<T>(
  items: T[],
  resolveKategori: (item: T) => PekerjaanInfraKategori,
  compare?: (a: T, b: T) => number,
): { kategori: PekerjaanInfraKategori; label: string; items: T[] }[] {
  const buckets = new Map<PekerjaanInfraKategori, T[]>();
  for (const k of PEKERJAAN_INFRA_KATEGORI_ORDER) buckets.set(k, []);

  for (const item of items) {
    const k = resolveKategori(item);
    buckets.get(k)?.push(item);
  }

  return PEKERJAAN_INFRA_KATEGORI_ORDER.map((kategori) => ({
    kategori,
    label: PEKERJAAN_INFRA_KATEGORI_LABEL[kategori],
    items: compare
      ? [...(buckets.get(kategori) ?? [])].sort(compare)
      : (buckets.get(kategori) ?? []),
  })).filter((g) => g.items.length > 0);
}

export function groupPekerjaanByKategori<T extends PekerjaanWithKategori>(
  items: T[],
): { kategori: PekerjaanInfraKategori; label: string; items: T[] }[] {
  return groupByKategori(
    items,
    (item) => item.kategori ?? 'LAINNYA',
    (a, b) => a.urutan - b.urutan,
  );
}

export function isStandardPekerjaanKategori(kategori: PekerjaanInfraKategori) {
  return kategori === 'SALURAN' || kategori === 'JALAN';
}

const PEKERJAAN_INFRA_ICONS: LucideIcon[] = [
  Shovel,
  Cylinder,
  Mountain,
  AlignJustify,
  Pickaxe,
  Truck,
  Layers,
  Construction,
  Route,
  Box,
  Square,
  Grid3x3,
  Boxes,
  Hammer,
  Paintbrush,
  Scissors,
  Droplets,
];

const PEKERJAAN_INFRA_ACTIVE_COLORS: string[] = [
  'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
  'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
  'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  'text-lime-600 bg-lime-50 border-lime-200 hover:bg-lime-100',
  'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100',
  'text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  'text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100',
  'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
  'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  'text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100',
  'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
  'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
  'text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100',
  'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100',
  'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
  'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
];

export const PEKERJAAN_INFRA_IDLE_CLASS =
  'text-slate-400 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300';

export function getPekerjaanInfraIcon(urutan: number): LucideIcon {
  return PEKERJAAN_INFRA_ICONS[urutan - 1] ?? Wrench;
}

export function getPekerjaanInfraActiveColor(urutan: number): string {
  return PEKERJAAN_INFRA_ACTIVE_COLORS[(urutan - 1) % PEKERJAAN_INFRA_ACTIVE_COLORS.length]!;
}

export function pekerjaanInfraHasProgress(latestPersentase?: number | null): boolean {
  return latestPersentase != null && latestPersentase > 0;
}
