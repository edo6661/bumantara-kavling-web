import type {
  SpkNominalInput,
  SpkPembayaranCalcRow,
  SpkPembayaranJenis,
  SpkTerminSchemeParam,
} from './spkPembayaran';
import {
  getSpkTerminScheme,
  getTerminStep,
  type SpkTerminPembayaranJenis,
} from './spkTerminScheme';
import { sumKasbonForTermin, sumPengurangJenisForTermin } from './spkPembayaran';

export interface SpkPembayaranKalkulasiBaris {
  label: string;
  nilai: number;
  tipe: 'positif' | 'negatif' | 'hasil';
}

export function buildSpkPembayaranKalkulasi(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
  pembayaranList: SpkPembayaranCalcRow[] = [],
  terminScheme: SpkTerminSchemeParam = 'RUMAH_DEFAULT',
): SpkPembayaranKalkulasiBaris[] {
  const kontrak = spk.nilaiKontrak;
  const step = getTerminStep(
    getSpkTerminScheme(terminScheme),
    jenis as SpkTerminPembayaranJenis,
  );
  const baris: SpkPembayaranKalkulasiBaris[] = [
    { label: 'Nilai kontrak', nilai: kontrak, tipe: 'positif' },
  ];

  if (!step) return baris;

  const bruto = kontrak * step.kontrakFraction;
  baris.push({
    label: `${Math.round(step.kontrakFraction * 100)}%`,
    nilai: bruto,
    tipe: 'positif',
  });

  if (step.jenis !== 'RETENSI') {
    const totalKasbon = sumPengurangJenisForTermin(
      kontrak,
      pembayaranList,
      step.jenis,
      'KASBON',
      terminScheme,
    );
    const totalUpah = sumPengurangJenisForTermin(
      kontrak,
      pembayaranList,
      step.jenis,
      'UPAH',
      terminScheme,
    );
    const kasbon = sumKasbonForTermin(kontrak, pembayaranList, step.jenis, terminScheme);
    if (totalKasbon > 0) {
      baris.push({ label: 'Total kasbon', nilai: totalKasbon, tipe: 'negatif' });
    }
    if (totalUpah > 0) {
      baris.push({ label: 'Total upah', nilai: totalUpah, tipe: 'negatif' });
    }
    baris.push({
      label: 'Nominal',
      nilai: Math.max(0, bruto - kasbon),
      tipe: 'hasil',
    });
  } else {
    baris.push({ label: 'Nominal', nilai: bruto, tipe: 'hasil' });
  }

  return baris;
}
