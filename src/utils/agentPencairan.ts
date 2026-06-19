import type { AgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData } from '../services/agentPencairan.service';
import { extractClosingDpp } from './agentPkpTax';

export const KOMISI_CASH_PPJB_RATIO = 0.5;

export type SaleDetail = {
  status?: string | null;
  caraPembayaran?: string | null;
  hargaJual?: number | null;
  fileBuktiBooking?: string | null;
  tagihan?: Array<{ pembayaran?: string; tujuan?: string; status?: string }>;
  progressPenjualan?: {
    nilaiAjb?: number | null;
    filePpjb?: string | null;
    fileAjb?: string | null;
    fileSp3k?: string | null;
    fileSuratPernyataanAkadKredit?: string | null;
  } | null;
};

export type PenjualanSaleRef = {
  id: number;
  noTransaksi: string;
  status?: string | null;
  hargaJual?: number | null;
  caraPembayaran?: string | null;
};

const inferTagihanTujuanFromPembayaran = (pembayaran: string) => {
  const p = pembayaran.trim().toLowerCase();
  if (p.includes('booking')) return 'BOOKING_FEE';
  if (/^cicilan ke-\d+$/.test(p)) return 'HARGA_JUAL';
  if (
    p.includes('down payment') ||
    p.includes('uang muka') ||
    (p.includes('dp') && !p.includes('booking'))
  ) {
    return 'DP';
  }
  return 'LAINNYA';
};

const effectiveTagihanTujuan = (tagihan: {
  tujuan?: string | null;
  pembayaran?: string;
}) => {
  if (tagihan.tujuan != null && tagihan.tujuan !== 'LAINNYA') {
    return tagihan.tujuan;
  }
  return inferTagihanTujuanFromPembayaran(tagihan.pembayaran ?? '');
};

/** Gabungkan data penjualan dari list API dengan ringkasan di agent */
export const resolveSaleDetail = (
  sale: PenjualanSaleRef,
  penjualanList: Array<PenjualanSaleRef & SaleDetail>,
): SaleDetail => {
  const matched = penjualanList.find(
    (p) => p.id === sale.id || p.noTransaksi === sale.noTransaksi,
  );
  return {
    status: matched?.status ?? sale.status,
    caraPembayaran: matched?.caraPembayaran ?? sale.caraPembayaran,
    hargaJual: matched?.hargaJual ?? sale.hargaJual,
    fileBuktiBooking: matched?.fileBuktiBooking,
    tagihan: matched?.tagihan,
    progressPenjualan: matched?.progressPenjualan,
  };
};

export type PencairanKomponenKey = 'closing' | 'marketing';

export const isCashPayment = (caraPembayaran?: string | null) => {
  const key = (caraPembayaran ?? '').replace(/\s/g, '_').toUpperCase();
  return key === 'CASH_KERAS' || key === 'CASH_BERTAHAP';
};

export const isPenjualanBatal = (status?: string | null) =>
  (status ?? '').toUpperCase() === 'BATAL';

export const isBookingFeePaid = (detail?: SaleDetail) => {
  if (detail?.fileBuktiBooking) return true;
  return (detail?.tagihan ?? []).some(
    (t) =>
      effectiveTagihanTujuan(t) === 'BOOKING_FEE' && t.status === 'LUNAS',
  );
};

export const hasPpjbComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.filePpjb;

export const hasSp3kComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.fileSp3k;

export const hasAjbComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.fileAjb;

export const hasAkadKreditComplete = (
  progress?: SaleDetail['progressPenjualan'],
) =>
  !!(
    progress?.filePpjb ||
    progress?.fileAjb ||
    progress?.fileSuratPernyataanAkadKredit
  );

const sumSudahDiajukan = (pencairanList: AgentPencairanData[]) => ({
  closingNominal: pencairanList.reduce((s, p) => s + Number(p.closingNominal), 0),
  marketingNominal: pencairanList.reduce((s, p) => s + Number(p.marketingNominal), 0),
});

export const getClosingGross = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  if (!isBookingFeePaid(detail)) return 0;
  return Number(feeRecord.closingNominal) || Number(agent.feeClosingNominal) || 0;
};

/** DPP closing — untuk PKP di-extract dari bruto (÷ 1,11) */
export const getClosingFull = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => extractClosingDpp(getClosingGross(agent, feeRecord, detail), !!agent.isPkp);

export const getFullMarketingFee = (agent: AgentData, detail?: SaleDetail) => {
  if (isPenjualanBatal(detail?.status)) return 0;
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const pct = Number(agent.feeMarketingPct) || 0;
  return nilaiAjb > 0 && pct > 0 ? nilaiAjb * (pct / 100) : 0;
};

const getCashMarketingBuckets = (
  agent: AgentData,
  detail: SaleDetail | undefined,
  sudahMarketing: number,
) => {
  const full = getFullMarketingFee(agent, detail);
  const ppjbCap = full * KOMISI_CASH_PPJB_RATIO;
  const ajbCap = full - ppjbCap;
  const ppjbSudah = Math.min(sudahMarketing, ppjbCap);
  const ajbSudah = Math.max(0, sudahMarketing - ppjbCap);
  return {
    ppjbSisa: Math.max(0, ppjbCap - ppjbSudah),
    ajbSisa: Math.max(0, ajbCap - ajbSudah),
  };
};

export const getTotalFeeReferensi = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  if (isPenjualanBatal(detail?.status)) {
    return getClosingFull(agent, feeRecord, detail);
  }
  return getClosingFull(agent, feeRecord, detail) + getFullMarketingFee(agent, detail);
};

/** Total fee = closing fee + marketing fee */
export const getTotalFeeBruto = getTotalFeeReferensi;

/** Pot. PPh = total fee × (potonganPph% / 100) — sekali per penjualan */
export const calcPotonganPphFromReferensi = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => {
  const totalFee = getTotalFeeReferensi(agent, feeRecord, detail);
  const pct = Number(agent.potonganPph) || 0;
  return totalFee * (pct / 100);
};

export const calcPotonganPphTotal = calcPotonganPphFromReferensi;

/** Grand total transfer (penuh) = total fee − pot. PPh */
export const calcGrandTotalTransfer = (
  totalFee: number,
  potonganPph: number,
) => Math.max(0, totalFee - potonganPph);

/** PPh yang masih perlu dipotong pada pengajuan ini (total sekali per penjualan) */
export const calcPotonganPphUntukPengajuan = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
) => {
  const total = calcPotonganPphFromReferensi(agent, feeRecord, detail);
  const sudah = pencairanList.reduce((s, p) => s + Number(p.potonganPph), 0);
  return Math.max(0, total - sudah);
};

export interface PencairanKomponenInfo {
  key: PencairanKomponenKey;
  label: string;
  nominalPenuh: number;
  nominalSisa: number;
  eligible: boolean;
  alasan?: string;
}

export const getPencairanKomponen = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
): PencairanKomponenInfo[] => {
  const sudah = sumSudahDiajukan(pencairanList);
  const isCash = isCashPayment(detail?.caraPembayaran);
  const isBatal = isPenjualanBatal(detail?.status);
  const nilaiAjb = Number(detail?.progressPenjualan?.nilaiAjb) || 0;
  const closingFull = getClosingFull(agent, feeRecord, detail);
  const fullMarketing = getFullMarketingFee(agent, detail);
  const closingSisa = Math.max(0, closingFull - sudah.closingNominal);

  const closing: PencairanKomponenInfo = {
    key: 'closing',
    label: 'Closing Fee',
    nominalPenuh: closingFull,
    nominalSisa: closingSisa,
    eligible: false,
    alasan: closingSisa > 0 ? 'Belum memenuhi syarat closing fee' : 'Closing fee sudah diajukan',
  };

  if (closingSisa > 0) {
    if (!isBookingFeePaid(detail)) {
      closing.alasan = 'Booking fee belum lunas';
    } else if (isBatal) {
      closing.eligible = true;
      closing.alasan = 'Transaksi batal — closing fee dapat dicairkan';
    } else if (isCash && hasPpjbComplete(detail?.progressPenjualan)) {
      closing.eligible = true;
      closing.alasan = 'Dokumen PPJB sudah diunggah & booking lunas';
    } else if (!isCash && hasSp3kComplete(detail?.progressPenjualan)) {
      closing.eligible = true;
      closing.alasan = 'Dokumen SP3K sudah diunggah & booking lunas';
    } else if (isCash) {
      closing.alasan = 'Belum PPJB';
    } else {
      closing.alasan = 'Belum SP3K';
    }
  }

  const marketing: PencairanKomponenInfo = {
    key: 'marketing',
    label: 'Komisi Marketing',
    nominalPenuh: fullMarketing,
    nominalSisa: 0,
    eligible: false,
    alasan: 'Komisi marketing belum tersedia',
  };

  if (!isBatal && fullMarketing > 0 && isBookingFeePaid(detail)) {
    if (isCash) {
      const buckets = getCashMarketingBuckets(agent, detail, sudah.marketingNominal);
      marketing.nominalSisa = buckets.ppjbSisa + buckets.ajbSisa;

      if (marketing.nominalSisa <= 0) {
        marketing.alasan = 'Komisi marketing sudah diajukan semua';
      } else {
        const ppjbOk =
          buckets.ppjbSisa > 0 &&
          hasPpjbComplete(detail?.progressPenjualan) &&
          nilaiAjb > 0;
        const ajbOk =
          buckets.ajbSisa > 0 &&
          hasPpjbComplete(detail?.progressPenjualan) &&
          hasAjbComplete(detail?.progressPenjualan) &&
          nilaiAjb > 0;

        if (ppjbOk || ajbOk) {
          marketing.eligible = true;
          const parts: string[] = [];
          if (ppjbOk) parts.push('50% tahap PPJB');
          if (ajbOk) parts.push('50% tahap AJB');
          marketing.alasan = `Komisi tersedia: ${parts.join(' + ')}`;
        } else if (buckets.ppjbSisa > 0 && !hasPpjbComplete(detail?.progressPenjualan)) {
          marketing.alasan = 'Belum PPJB (tahap 50%)';
        } else if (buckets.ppjbSisa > 0 && nilaiAjb <= 0) {
          marketing.alasan = 'Isi nilai AJB di menu Progress Penjualan';
        } else {
          marketing.alasan = hasAjbComplete(detail?.progressPenjualan)
            ? 'Isi nilai AJB di menu Progress Penjualan'
            : 'Belum AJB (sisa 50%)';
        }
      }
    } else {
      marketing.nominalSisa = Math.max(0, fullMarketing - sudah.marketingNominal);

      if (marketing.nominalSisa <= 0) {
        marketing.alasan = 'Komisi marketing sudah diajukan semua';
      } else if (!hasSp3kComplete(detail?.progressPenjualan)) {
        marketing.alasan = 'Belum SP3K';
      } else if (!hasAkadKreditComplete(detail?.progressPenjualan)) {
        marketing.alasan =
          'Upload dokumen PPJB atau AJB (akad kredit) di menu Progress Penjualan';
      } else if (nilaiAjb <= 0) {
        marketing.alasan = 'Isi nilai AJB di menu Progress Penjualan';
      } else {
        marketing.eligible = true;
        marketing.alasan = 'SP3K & akad kredit sudah ada — komisi dari nilai AJB';
      }
    }
  } else if (!isBookingFeePaid(detail)) {
    marketing.alasan = 'Booking fee belum lunas';
  } else if (isBatal) {
    marketing.alasan = 'Transaksi batal — komisi marketing tidak dicairkan';
  } else if (isCash && fullMarketing <= 0 && isBookingFeePaid(detail)) {
    marketing.alasan =
      nilaiAjb <= 0
        ? 'Isi nilai AJB di menu Progress Penjualan'
        : 'Komisi marketing belum tersedia';
  } else if (!isCash && fullMarketing <= 0) {
    if (!hasSp3kComplete(detail?.progressPenjualan)) {
      marketing.alasan = 'Belum SP3K';
    } else if (!hasAkadKreditComplete(detail?.progressPenjualan)) {
      marketing.alasan =
        'Upload dokumen PPJB atau AJB (akad kredit) di menu Progress Penjualan';
    } else {
      marketing.alasan = 'Isi nilai AJB di menu Progress Penjualan';
    }
  }

  return [closing, marketing];
};

export const hasAnyEligiblePencairan = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
) => {
  if (!feeRecord) return false;
  return getPencairanKomponen(agent, feeRecord, pencairanList, detail).some(
    (k) => k.eligible && k.nominalSisa > 0,
  );
};

export const getPencairanBlockReason = (
  agent: AgentData,
  feeRecord: FeeAgentData | undefined,
  pencairanList: AgentPencairanData[],
  detail?: SaleDetail,
): string | null => {
  if (hasAnyEligiblePencairan(agent, feeRecord, pencairanList, detail)) {
    return null;
  }
  if (!feeRecord) return 'Data fee agent belum ada';

  const komponen = getPencairanKomponen(agent, feeRecord, pencairanList, detail);
  const feeTotals = getPencairanFeeTotals(agent, feeRecord, detail);
  const summary = summarizePencairanHistory(pencairanList);
  const fullySubmitted = isPencairanFullySubmitted(pencairanList, feeTotals);

  // Utamakan komponen yang masih punya sisa — jangan tampilkan "closing sudah" saat marketing masih pending
  const withSisa = komponen.filter((k) => k.nominalSisa > 0);
  if (withSisa.length > 0) {
    const blocked = withSisa.find((k) => !k.eligible);
    return blocked?.alasan ?? withSisa[0]?.alasan ?? null;
  }

  if (summary.jumlahPengajuan === 0) {
    const blocked = komponen.find(
      (k) => !k.eligible && (k.nominalPenuh > 0 || k.key === 'marketing'),
    );
    return blocked?.alasan ?? 'Belum memenuhi syarat pencairan';
  }

  if (summary.jumlahMenunggu > 0) {
    return 'Menunggu pembayaran finance';
  }

  if (fullySubmitted) {
    return 'Sudah dibayar';
  }

  // Tahap sebelumnya sudah terbayar; tahap berikutnya belum memenuhi syarat
  const nextBlocked = komponen.find((k) => !k.eligible);
  return nextBlocked?.alasan ?? 'Menunggu syarat tahap pencairan berikutnya';
};

export interface PencairanFeeTotals {
  closingFull: number;
  marketingFull: number;
}

export const getPencairanFeeTotals = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
): PencairanFeeTotals => {
  const closingFull = getClosingFull(agent, feeRecord, detail);
  const marketingFull = getFullMarketingFee(agent, detail);
  return { closingFull, marketingFull };
};

export const isPencairanFullySubmitted = (
  pencairanList: AgentPencairanData[],
  feeTotals: PencairanFeeTotals,
) => {
  const summary = summarizePencairanHistory(pencairanList);
  const diajukanGross =
    summary.totalClosingDiajukan + summary.totalMarketingDiajukan;
  const fullGross = feeTotals.closingFull + feeTotals.marketingFull;
  return fullGross <= 0 || diajukanGross >= fullGross - 1;
};

export const sortPencairanRecords = (pencairanList: AgentPencairanData[]) =>
  [...pencairanList].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export interface PencairanHistorySummary {
  jumlahPengajuan: number;
  jumlahTerbayar: number;
  jumlahMenunggu: number;
  totalClosingDiajukan: number;
  totalMarketingDiajukan: number;
  totalClosingTerbayar: number;
  totalMarketingTerbayar: number;
  totalNominalTerbayar: number;
  totalNominalMenunggu: number;
}

export const summarizePencairanHistory = (
  pencairanList: AgentPencairanData[],
): PencairanHistorySummary => {
  let totalClosingDiajukan = 0;
  let totalMarketingDiajukan = 0;
  let totalClosingTerbayar = 0;
  let totalMarketingTerbayar = 0;
  let totalNominalTerbayar = 0;
  let totalNominalMenunggu = 0;
  let jumlahTerbayar = 0;
  let jumlahMenunggu = 0;

  for (const row of pencairanList) {
    totalClosingDiajukan += Number(row.closingNominal);
    totalMarketingDiajukan += Number(row.marketingNominal);

    if (row.status === 'SUDAH_DIBAYAR') {
      jumlahTerbayar += 1;
      totalClosingTerbayar += Number(row.closingNominal);
      totalMarketingTerbayar += Number(row.marketingNominal);
      totalNominalTerbayar += Number(row.totalNominal);
    } else {
      jumlahMenunggu += 1;
      totalNominalMenunggu += Number(row.totalNominal);
    }
  }

  return {
    jumlahPengajuan: pencairanList.length,
    jumlahTerbayar,
    jumlahMenunggu,
    totalClosingDiajukan,
    totalMarketingDiajukan,
    totalClosingTerbayar,
    totalMarketingTerbayar,
    totalNominalTerbayar,
    totalNominalMenunggu,
  };
};

export const getPencairanPaymentStatus = (
  pencairanList: AgentPencairanData[],
  feeTotals?: PencairanFeeTotals,
) => {
  if (pencairanList.length === 0) {
    return { label: 'Belum', className: 'bg-red-100 text-red-700', hint: undefined as string | undefined };
  }

  const summary = summarizePencairanHistory(pencairanList);
  const fullGross = feeTotals
    ? feeTotals.closingFull + feeTotals.marketingFull
    : 0;
  const diajukanGross =
    summary.totalClosingDiajukan + summary.totalMarketingDiajukan;
  const fullySubmitted =
    !feeTotals || isPencairanFullySubmitted(pencairanList, feeTotals);
  const sisaBelumDiajukan = Math.max(0, fullGross - diajukanGross);

  if (summary.jumlahMenunggu > 0 && summary.jumlahTerbayar === 0) {
    return {
      label: summary.jumlahMenunggu > 1 ? `Menunggu (${summary.jumlahMenunggu}x)` : 'Menunggu',
      className: 'bg-amber-100 text-amber-700',
      hint: undefined,
    };
  }

  if (summary.jumlahMenunggu > 0 && summary.jumlahTerbayar > 0) {
    return {
      label: `Sebagian (${summary.jumlahTerbayar}/${summary.jumlahPengajuan})`,
      className: 'bg-blue-100 text-blue-700',
      hint: feeTotals && sisaBelumDiajukan > 0
        ? `Sisa belum diajukan: ${formatRupiahCompact(sisaBelumDiajukan)}`
        : undefined,
    };
  }

  // Semua pengajuan sudah dibayar finance, tapi masih ada komponen belum diajukan
  if (!fullySubmitted) {
    return {
      label: 'Belum penuh',
      className: 'bg-indigo-100 text-indigo-800',
      hint: `Sudah ${formatRupiahCompact(diajukanGross)} dari ${formatRupiahCompact(fullGross)}`,
    };
  }

  return {
    label: summary.jumlahPengajuan > 1 ? `Lunas (${summary.jumlahPengajuan}x)` : 'Lunas',
    className: 'bg-green-100 text-green-700',
    hint: undefined,
  };
};

const formatRupiahCompact = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
