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

export function calcPajakFromNilaiAjb(nilaiAjb: number) {
  return {
    biayaPph: nilaiAjb * 0.025,
    biayaBphtb: Math.max(0, nilaiAjb - 80_000_000) * 0.05,
  };
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
  for (let urutan = 1; urutan <= jumlahSertifikatTanah; urutan++) {
    if (!getProgressSlot(progress, urutan).filePpjb?.trim()) return false;
  }
  return true;
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
