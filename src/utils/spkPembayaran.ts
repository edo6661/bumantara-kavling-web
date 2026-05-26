export type SpkPembayaranJenis = 'TERMIN_55' | 'TERMIN_100' | 'RETENSI';
export type SpkPembayaranStatus = 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR';

export const SPK_PROGRESS_TERMIN_55 = 55;
export const SPK_PROGRESS_TERMIN_100 = 100;

export const SPK_PEMBAYARAN_JENIS_LABEL: Record<SpkPembayaranJenis, string> = {
  TERMIN_55: 'Termin 55% (50% kontrak)',
  TERMIN_100: 'Termin 100% (45% kontrak)',
  RETENSI: 'Retensi (5% kontrak)',
};

export interface SpkNominalInput {
  nilaiKontrak: number;
  kasbonSebelumTermin2: number | null;
  kasbonSebelumTermin3: number | null;
}

export function calcSpkPembayaranNominal(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput,
): number {
  const kontrak = spk.nilaiKontrak;
  switch (jenis) {
    case 'TERMIN_55':
      return Math.max(0, kontrak * 0.5 - (spk.kasbonSebelumTermin2 ?? 0));
    case 'TERMIN_100':
      return Math.max(0, kontrak * 0.45 - (spk.kasbonSebelumTermin3 ?? 0));
    case 'RETENSI':
      return Math.max(0, kontrak * 0.05);
    default:
      return 0;
  }
}

function getMinProgressForJenis(jenis: SpkPembayaranJenis): number {
  return jenis === 'TERMIN_55' ? SPK_PROGRESS_TERMIN_55 : SPK_PROGRESS_TERMIN_100;
}

function getPrerequisiteJenis(jenis: SpkPembayaranJenis): SpkPembayaranJenis | null {
  if (jenis === 'TERMIN_100') return 'TERMIN_55';
  if (jenis === 'RETENSI') return 'TERMIN_100';
  return null;
}

export interface SpkPembayaranStatusRow {
  jenis: SpkPembayaranJenis;
  status: SpkPembayaranStatus;
}

export function canRequestSpkPembayaran(
  jenis: SpkPembayaranJenis,
  spk: SpkNominalInput & { progress: number },
  pembayaranList: SpkPembayaranStatusRow[],
): { allowed: boolean; reason?: string; nominal: number } {
  const nominal = calcSpkPembayaranNominal(jenis, spk);

  if (pembayaranList.some((p) => p.jenis === jenis)) {
    return { allowed: false, reason: 'Pengajuan termin ini sudah ada.', nominal };
  }

  if (spk.progress < getMinProgressForJenis(jenis)) {
    return {
      allowed: false,
      reason: `Progress SPK minimal ${getMinProgressForJenis(jenis)}%.`,
      nominal,
    };
  }

  const prereq = getPrerequisiteJenis(jenis);
  if (
    prereq &&
    !pembayaranList.some((p) => p.jenis === prereq && p.status === 'SUDAH_DIBAYAR')
  ) {
    return {
      allowed: false,
      reason: `Harus menunggu pembayaran ${SPK_PEMBAYARAN_JENIS_LABEL[prereq]} oleh finance.`,
      nominal,
    };
  }

  if (nominal <= 0) {
    return { allowed: false, reason: 'Nominal pembayaran tidak valid.', nominal };
  }

  return { allowed: true, nominal };
}
