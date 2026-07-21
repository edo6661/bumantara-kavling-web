export interface ProgressSertifikatSlot {
  nilaiAjb?: number | null;
  biayaBphtb?: number | null;
  biayaPph?: number | null;
  filePpjb?: string | null;
  fileAjb?: string | null;
  nomorAjb?: string | null;
  tanggalAjb?: string | null;
}

export interface ProgressSertifikatTambahanSlot extends ProgressSertifikatSlot {
  urutan: number;
}

export interface ProgressPenjualanLike {
  nilaiAjb?: number | null;
  biayaBphtb?: number | null;
  biayaPph?: number | null;
  filePpjb?: string | null;
  fileAjb?: string | null;
  fileSp3k?: string | null;
  fileSuratPernyataanAkadKredit?: string | null;
  nomorAjb?: string | null;
  tanggalAjb?: string | null;
  sertifikatTambahan?: ProgressSertifikatTambahanSlot[];
  totals?: {
    nilaiAjb: number;
    biayaBphtb: number;
    biayaPph: number;
  };
}

const BPHTB_EXEMPTION = 80_000_000;
const BPHTB_RATE = 0.05;
const PPH_RATE = 0.025;

export interface NilaiAjbSlot {
  urutan: number;
  nilaiAjb: number;
}

function getExemptUrutan(slots: NilaiAjbSlot[]): number | null {
  const withValue = slots.filter((slot) => slot.nilaiAjb > 0);
  if (withValue.length <= 1) return null;
  const minNilai = Math.min(...withValue.map((slot) => slot.nilaiAjb));
  const minSlots = withValue.filter((slot) => slot.nilaiAjb === minNilai);
  return Math.min(...minSlots.map((slot) => slot.urutan));
}

export function calcBphtbFromNilaiAjb(
  nilaiAjb: number,
  urutan: number,
  allSlots: NilaiAjbSlot[],
): number {
  if (nilaiAjb <= 0) return 0;
  const exemptUrutan = getExemptUrutan(allSlots);
  if (exemptUrutan === urutan) {
    return nilaiAjb * BPHTB_RATE;
  }
  return Math.max(0, nilaiAjb - BPHTB_EXEMPTION) * BPHTB_RATE;
}

export function calcPajakFromNilaiAjb(
  nilaiAjb: number,
  options?: { urutan?: number; allSlots?: NilaiAjbSlot[] },
) {
  const biayaPph = nilaiAjb * PPH_RATE;
  const biayaBphtb =
    options?.allSlots && options.urutan != null
      ? calcBphtbFromNilaiAjb(nilaiAjb, options.urutan, options.allSlots)
      : Math.max(0, nilaiAjb - BPHTB_EXEMPTION) * BPHTB_RATE;
  return { biayaPph, biayaBphtb };
}

export function getProgressSlot(
  progress: ProgressPenjualanLike | null | undefined,
  urutan: number,
): ProgressSertifikatSlot {
  if (!progress) return {};
  if (urutan === 1) {
    return {
      nilaiAjb: progress.nilaiAjb,
      biayaBphtb: progress.biayaBphtb,
      biayaPph: progress.biayaPph,
      filePpjb: progress.filePpjb,
      fileAjb: progress.fileAjb,
      nomorAjb: progress.nomorAjb,
      tanggalAjb: progress.tanggalAjb,
    };
  }
  const row = progress.sertifikatTambahan?.find((item) => item.urutan === urutan);
  return row ?? {};
}

export function getTotalNilaiAjb(progress: ProgressPenjualanLike | null | undefined): number {
  if (!progress) return 0;
  if (progress.totals?.nilaiAjb != null) return progress.totals.nilaiAjb;
  const utama = progress.nilaiAjb ? Number(progress.nilaiAjb) : 0;
  const tambahan = (progress.sertifikatTambahan ?? []).reduce(
    (sum, row) => sum + (row.nilaiAjb ? Number(row.nilaiAjb) : 0),
    0,
  );
  return utama + tambahan;
}

export function isAllTanahSertifikatComplete(
  jumlahSertifikatTanah: number,
  row: {
    filePbg?: string | null;
    fileSertifikatTanah?: string | null;
    fileNopPbb?: string | null;
    sertifikatTanahTambahan?: Array<{
      urutan: number;
      filePbg?: string | null;
      fileSertifikatTanah?: string | null;
      fileNopPbb?: string | null;
    }>;
  },
): boolean {
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    const slot =
      urutan === 1
        ? row
        : row.sertifikatTanahTambahan?.find((item) => item.urutan === urutan);
    if (
      !slot?.filePbg?.trim() ||
      !slot?.fileSertifikatTanah?.trim() ||
      !slot?.fileNopPbb?.trim()
    ) {
      return false;
    }
  }
  return true;
}

export function isAllProgressFilePpjbComplete(
  jumlahSertifikatTanah: number,
  progress: ProgressPenjualanLike | null | undefined,
): boolean {
  // Multi sertifikat: PPJB tetap 1 (hanya urutan 1), AJB mengikuti jumlah sertifikat
  void jumlahSertifikatTanah;
  return Boolean(getProgressSlot(progress, 1).filePpjb?.trim());
}

export function isAllProgressFileAjbComplete(
  jumlahSertifikatTanah: number,
  progress: ProgressPenjualanLike | null | undefined,
): boolean {
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    if (!getProgressSlot(progress, urutan).fileAjb?.trim()) return false;
  }
  return true;
}

export function hasAnyTanahSertifikat(
  jumlahSertifikatTanah: number,
  row: {
    filePbg?: string | null;
    fileSertifikatTanah?: string | null;
    fileNopPbb?: string | null;
    sertifikatTanahTambahan?: Array<{
      urutan: number;
      filePbg?: string | null;
      fileSertifikatTanah?: string | null;
      fileNopPbb?: string | null;
    }>;
  },
): boolean {
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    const slot =
      urutan === 1
        ? row
        : row.sertifikatTanahTambahan?.find((item) => item.urutan === urutan);
    if (slot?.filePbg || slot?.fileSertifikatTanah || slot?.fileNopPbb) {
      return true;
    }
  }
  return false;
}
