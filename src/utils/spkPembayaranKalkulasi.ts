import type { SpkNominalInput, SpkPembayaranCalcRow, SpkPembayaranJenis } from './spkPembayaran';
import { sumKasbonForTermin } from './spkPembayaran';

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: 'positif' | 'negatif' | 'hasil';
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: 'Nilai kontrak', nilai: kontrak, tipe: 'positif' },
  ];

  switch (jenis) {
    case 'TERMIN_55': {
      const bruto = kontrak * 0.5;
      const kasbon = sumKasbonForTermin(pembayaranList, 'TERMIN_55');
      baris.push({ label: '50%', nilai: bruto, tipe: 'positif' });
      if (kasbon > 0) {
        baris.push({ label: 'Total kasbon (termin 55%)', nilai: kasbon, tipe: 'negatif' });
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
      const kasbon = sumKasbonForTermin(pembayaranList, 'TERMIN_100');
      baris.push({ label: '45%', nilai: bruto, tipe: 'positif' });
      if (kasbon > 0) {
        baris.push({ label: 'Total kasbon (termin 100%)', nilai: kasbon, tipe: 'negatif' });
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
    default:
      break;
  }

  return baris;
}
