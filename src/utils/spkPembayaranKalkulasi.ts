import type { SpkNominalInput, SpkPembayaranJenis } from './spkPembayaran';

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: 'positif' | 'negatif' | 'hasil';
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: 'Nilai kontrak', nilai: kontrak, tipe: 'positif' },
  ];

  switch (jenis) {
    case 'TERMIN_55': {
      const bruto = kontrak * 0.5;
      const kasbon = spk.kasbonSebelumTermin2 ?? 0;
      baris.push({
        label: '50%',
        nilai: bruto,
        tipe: 'positif',
      });
      if (kasbon > 0) {
        baris.push({ label: 'Kasbon 55%', nilai: kasbon, tipe: 'negatif' });
      }
      baris.push({
        label: 'Nominal',
        nilai: Math.max(0, bruto - kasbon),
        tipe: 'hasil',
      });
      break;
    }
    case 'TERMIN_100': {
      const bruto = kontrak * 0.45;
      const kasbon = spk.kasbonSebelumTermin3 ?? 0;
      baris.push({
        label: '45%',
        nilai: bruto,
        tipe: 'positif',
      });
      if (kasbon > 0) {
        baris.push({ label: 'Kasbon 100%', nilai: kasbon, tipe: 'negatif' });
      }
      baris.push({
        label: 'Nominal',
        nilai: Math.max(0, bruto - kasbon),
        tipe: 'hasil',
      });
      break;
    }
    case 'RETENSI': {
      const bruto = kontrak * 0.05;
      baris.push({ label: 'Retensi 5%', nilai: bruto, tipe: 'positif' });
      baris.push({ label: 'Nominal', nilai: bruto, tipe: 'hasil' });
      break;
    }
  }

  return baris;
}
