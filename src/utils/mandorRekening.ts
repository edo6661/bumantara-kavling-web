import type { SpkPembayaranData } from '../services/spkPembayaran.service';

export interface MandorRekeningData {
  id: number;
  label?: string | null;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  isDefault?: boolean;
}

export interface MandorRekeningFormRow {
  key: string;
  id?: number;
  label: string;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  isDefault: boolean;
}

export const formatMandorRekeningLabel = (rek: MandorRekeningData) => {
  const label = rek.label?.trim();
  const bankLine = `${rek.namaBank} · ${rek.noRekening}`;
  return label ? `${label} — ${bankLine}` : bankLine;
};

export const resolveSpkPembayaranTransferRekening = (
  row: SpkPembayaranData,
): MandorRekeningData | null => {
  if (row.mandorRekening) return row.mandorRekening;
  const mandor = row.spk?.mandor;
  if (!mandor?.noRekening && !mandor?.namaBank) return null;
  return {
    id: row.mandorRekeningId ?? 0,
    namaBank: mandor.namaBank,
    noRekening: mandor.noRekening,
    atasNamaRekening: mandor.atasNamaRekening,
  };
};

export const pickDefaultMandorRekeningId = (
  list: MandorRekeningData[],
): number | '' => {
  if (!list.length) return '';
  const def = list.find((item) => item.isDefault) ?? list[0];
  return def?.id ?? '';
};
