import type { AgentData, PenjualanAgentData } from '../types/models/agent';
import type { FeeAgentData } from '../services/feeAgent.service';
import type { AgentPencairanData, AgentPencairanTahap } from '../services/agentPencairan.service';
import { extractClosingDpp, extractClosingPpn } from './agentPkpTax';
import { isAgentPerusahaan } from './agentCommercialProfile';
import {
  getTotalNilaiAjb,
  isAllProgressFileAjbComplete,
  isAllProgressFilePpjbComplete,
  type ProgressPenjualanLike,
} from './progressPenjualanSertifikat';

export { getTotalNilaiAjb } from './progressPenjualanSertifikat';

export const KOMISI_CASH_PPJB_RATIO = 0.5;

/** Agent in-house: tanpa closing fee, komisi tetap 0,5% dari nilai AJB (syarat pencairan sama agent eksternal) */
export const IN_HOUSE_FEE_MARKETING_PCT = 0.5;

export const isAgentInHouse = (agent: { isInHouse?: boolean | null }) => !!agent.isInHouse;

export const getEffectiveMarketingPct = (agent: AgentData) =>
  isAgentInHouse(agent) ? IN_HOUSE_FEE_MARKETING_PCT : (Number(agent.feeMarketingPct) || 0);

export type SaleDetail = {
  status?: string | null;
  bookingFeeLunasBatal?: boolean;
  caraPembayaran?: string | null;
  hargaJual?: number | null;
  fileBuktiBooking?: string | null;
  jumlahSertifikatTanah?: number;
  tagihan?: Array<{ pembayaran?: string; tujuan?: string; status?: string }>;
  progressPenjualan?: ProgressPenjualanLike | null;
  kavling?: { jumlahSertifikatTanah?: number };
};

export const resolveJumlahSertifikatTanah = (detail?: SaleDetail) =>
  Math.max(
    1,
    Number(
      detail?.jumlahSertifikatTanah ?? detail?.kavling?.jumlahSertifikatTanah ?? 1,
    ),
  );

export type PenjualanSaleRef = {
  id: number;
  noTransaksi: string;
  status?: string | null;
  hargaJual?: number | null;
  caraPembayaran?: string | null;
  bookingFeeLunasBatal?: boolean;
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
  sale: PenjualanIdentity & Partial<Omit<PenjualanSaleRef, 'id'>>,
  penjualanList: PenjualanListItem[],
): SaleDetail => {
  const matched = penjualanList.find((p) => isSamePenjualan(sale, p));
  return {
    status: matched?.status ?? sale.status,
    caraPembayaran: matched?.caraPembayaran ?? sale.caraPembayaran,
    hargaJual: matched?.hargaJual ?? sale.hargaJual,
    fileBuktiBooking: matched?.fileBuktiBooking,
    bookingFeeLunasBatal:
      matched?.bookingFeeLunasBatal ?? sale.bookingFeeLunasBatal,
    jumlahSertifikatTanah:
      (matched as SaleDetail | undefined)?.jumlahSertifikatTanah ??
      (matched as SaleDetail | undefined)?.kavling?.jumlahSertifikatTanah,
    tagihan: matched?.tagihan,
    progressPenjualan: matched?.progressPenjualan,
    kavling: (matched as SaleDetail | undefined)?.kavling,
  };
};

export type PencairanKomponenKey = 'closing' | 'marketing';

export const isCashPayment = (caraPembayaran?: string | null) => {
  const key = (caraPembayaran ?? '').replace(/\s/g, '_').toUpperCase();
  return key === 'CASH_KERAS' || key === 'CASH_BERTAHAP';
};

/** Label tahap di UI — AJB pada KPR berarti komisi penuh, bukan wajib upload AJB */
export const formatPencairanTahapLabel = (
  tahap: AgentPencairanTahap,
  caraPembayaran?: string | null,
) => {
  if (tahap === 'PPJB') return '50% PPJB';
  if (caraPembayaran == null) return 'Komisi penuh';
  return isCashPayment(caraPembayaran) ? '50% AJB' : 'Komisi KPR';
};

export const isPenjualanBatal = (status?: string | null) =>
  (status ?? '').toUpperCase() === 'BATAL';

export const isBookingFeePaid = (detail?: SaleDetail) => {
  if (isPenjualanBatal(detail?.status)) {
    return !!detail?.bookingFeeLunasBatal;
  }

  return (
    !!detail?.bookingFeeLunasBatal ||
    (detail?.tagihan ?? []).some(
      (t) =>
        effectiveTagihanTujuan(t) === 'BOOKING_FEE' && t.status === 'LUNAS',
    )
  );
};

type PenjualanListItem = Omit<PenjualanSaleRef, 'id'> &
  SaleDetail & {
    id?: number | string;
    dbId?: number | null;
    agent?: string;
    nama?: string;
    tanggal?: string;
    blok?: string;
    nomorUnit?: string;
    perumahan?: string;
  };

type PenjualanIdentity = {
  id?: number | string;
  dbId?: number | null;
  noTransaksi?: string;
};

/** API /penjualan memakai `id` = noTransaksi (string); relasi agent memakai id numerik DB. */
const getPenjualanNumericId = (item: PenjualanIdentity): number | null => {
  if (item.dbId != null) {
    const dbId = Number(item.dbId);
    if (!Number.isNaN(dbId)) return dbId;
  }
  if (typeof item.id === 'number' && !Number.isNaN(item.id)) return item.id;
  return null;
};

const isSamePenjualan = (a: PenjualanIdentity, b: PenjualanIdentity) => {
  const aId = getPenjualanNumericId(a);
  const bId = getPenjualanNumericId(b);
  if (aId != null && bId != null && aId === bId) return true;

  const aNo =
    a.noTransaksi?.trim() ||
    (typeof a.id === 'string' ? a.id.trim() : '');
  const bNo =
    b.noTransaksi?.trim() ||
    (typeof b.id === 'string' ? b.id.trim() : '');
  return Boolean(aNo && bNo && aNo === bNo);
};

const buildPenjualanSeenKeys = (sales: PenjualanIdentity[]) => {
  const seen = new Set<string>();
  sales.forEach((sale) => {
    const numId = getPenjualanNumericId(sale);
    if (numId != null) seen.add(`id:${numId}`);
    const no =
      sale.noTransaksi?.trim() ||
      (typeof sale.id === 'string' ? sale.id.trim() : '');
    if (no) seen.add(`no:${no}`);
  });
  return seen;
};

const isPenjualanSeen = (sale: PenjualanIdentity, seen: Set<string>) => {
  const numId = getPenjualanNumericId(sale);
  if (numId != null && seen.has(`id:${numId}`)) return true;
  const no =
    sale.noTransaksi?.trim() ||
    (typeof sale.id === 'string' ? sale.id.trim() : '');
  return Boolean(no && seen.has(`no:${no}`));
};

/** Penjualan batal yang booking fee-nya sudah lunas — eligible closing fee saja */
export const isBatalClosingEligible = (detail?: SaleDetail) =>
  isPenjualanBatal(detail?.status) && isBookingFeePaid(detail);

/**
 * Gabungkan penjualan dari relasi agent dengan penjualan BATAL eligible
 * yang mungkin belum muncul di API agent (mis. field flag belum ter-select).
 */
export const mergeAgentPenjualanWithEligibleBatal = (
  agent: Pick<AgentData, 'nama' | 'penjualan'>,
  penjualanList: PenjualanListItem[],
): PenjualanAgentData[] => {
  const base = agent.penjualan ?? [];
  const seen = buildPenjualanSeenKeys(base);

  const extras = penjualanList
    .filter((p) => {
      if (isPenjualanSeen(p, seen)) return false;
      if ((p.agent ?? '').trim() !== agent.nama.trim()) return false;
      return isBatalClosingEligible(resolveSaleDetail(p, penjualanList));
    })
    .map((p): PenjualanAgentData => {
      const numericId = getPenjualanNumericId(p);
      const noTransaksi =
        p.noTransaksi?.trim() ||
        (typeof p.id === 'string' ? p.id.trim() : '');

      return {
        id: numericId ?? 0,
        noTransaksi,
        tanggal: p.tanggal ?? '',
        hargaJual: Number(p.hargaJual ?? 0),
        status: p.status ?? 'BATAL',
        bookingFeeLunasBatal: p.bookingFeeLunasBatal ?? true,
        customer: { nama: p.nama ?? '' },
        kavling: {
          blok: p.blok ?? '',
          nomorUnit: p.nomorUnit ?? '',
          perumahan: p.perumahan ? { nama: p.perumahan } : undefined,
        },
      };
    })
    .filter((sale) => sale.id > 0 && sale.noTransaksi);

  return [...base, ...extras];
};

export const hasPpjbComplete = (
  progress?: SaleDetail['progressPenjualan'],
  jumlahSertifikatTanah = 1,
) => isAllProgressFilePpjbComplete(jumlahSertifikatTanah, progress);

export const hasSp3kComplete = (
  progress?: SaleDetail['progressPenjualan'],
) => !!progress?.fileSp3k;

export const hasAjbComplete = (
  progress?: SaleDetail['progressPenjualan'],
  jumlahSertifikatTanah = 1,
) => isAllProgressFileAjbComplete(jumlahSertifikatTanah, progress);

export const hasAkadKreditComplete = (
  progress?: SaleDetail['progressPenjualan'],
  jumlahSertifikatTanah = 1,
) =>
  !!(
    progress?.fileSuratPernyataanAkadKredit ||
    hasPpjbComplete(progress, jumlahSertifikatTanah) ||
    hasAjbComplete(progress, jumlahSertifikatTanah)
  );

const sumSudahDiajukan = (pencairanList: AgentPencairanData[]) => ({
  closingNominal: pencairanList.reduce((s, p) => s + Number(p.closingNominal), 0),
  marketingNominal: pencairanList.reduce((s, p) => s + Number(p.marketingNominal), 0),
});

/** Nominal bruto closing — prioritas: fee_agent (jika > 0) lalu master agent/perusahaan */
export const resolveClosingFeeGross = (
  agent: AgentData,
  feeRecord?: FeeAgentData | null,
  detail?: SaleDetail,
) => {
  if (isAgentInHouse(agent) || !isBookingFeePaid(detail)) return 0;
  const fromFeeRecord =
    feeRecord?.closingNominal != null ? Number(feeRecord.closingNominal) : null;
  if (fromFeeRecord != null && fromFeeRecord > 0) return fromFeeRecord;
  return Number(agent.feeClosingNominal) || 0;
};

export const getClosingGross = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => resolveClosingFeeGross(agent, feeRecord, detail);

export const hasAgentClosingFeeConfigured = (agent?: AgentData | null) => {
  if (!agent || isAgentInHouse(agent)) return false;
  return (Number(agent.feeClosingNominal) || 0) > 0;
};

export const getMarketingFeeNotConfiguredReason = (agent: AgentData) =>
  isAgentPerusahaan(agent.type)
    ? 'Fee marketing belum diatur di master perusahaan agent'
    : 'Fee marketing belum diatur — edit agent dan isi kolom Fee Marketing (%)';

export type BatalClosingPencairanStatus = {
  canDisburse: boolean;
  message: string;
  tone: 'success' | 'warning' | 'muted';
};

/** Status pencairan closing fee untuk transaksi BATAL (booking lunas + fee agent terkonfigurasi) */
export const getBatalClosingPencairanStatus = (
  agent: AgentData | undefined | null,
  detail?: SaleDetail,
  feeRecord?: FeeAgentData | null,
): BatalClosingPencairanStatus => {
  if (!isBookingFeePaid(detail)) {
    return {
      canDisburse: false,
      message: 'Centang "Sudah bayar booking fee" saat edit transaksi batal',
      tone: 'warning',
    };
  }
  if (!agent) {
    return {
      canDisburse: false,
      message: 'Agent tidak ditemukan di master — pastikan nama agent sudah terdaftar',
      tone: 'warning',
    };
  }
  if (isAgentInHouse(agent)) {
    return {
      canDisburse: false,
      message: 'Agent in-house tidak memiliki closing fee',
      tone: 'muted',
    };
  }
  if (!feeRecord) {
    return {
      canDisburse: false,
      message:
        'Data fee_agent belum ada — jalankan Backfill Fee Agent di menu Marketing',
      tone: 'warning',
    };
  }
  const closingGross = resolveClosingFeeGross(agent, feeRecord, detail);
  if (closingGross <= 0) {
    return {
      canDisburse: false,
      message: isAgentPerusahaan(agent.type)
        ? 'Fee closing belum diatur di master perusahaan agent'
        : 'Fee closing belum diatur — edit agent dan isi kolom Fee Closing (Rp)',
      tone: 'warning',
    };
  }
  return {
    canDisburse: true,
    message: 'Dapat diajukan di menu Marketing → Agent',
    tone: 'success',
  };
};

/** DPP closing — untuk PKP di-extract dari bruto (÷ 1,11) */
export const getClosingFull = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => extractClosingDpp(getClosingGross(agent, feeRecord, detail), !!agent.isPkp);

/** Bagian PPN closing (hanya PKP) — ikut dijumlahkan ke total transfer */
export const getClosingPpn = (
  agent: AgentData,
  feeRecord: FeeAgentData,
  detail?: SaleDetail,
) => extractClosingPpn(getClosingGross(agent, feeRecord, detail), !!agent.isPkp);

export const getFullMarketingFee = (agent: AgentData, detail?: SaleDetail) => {
  if (isPenjualanBatal(detail?.status)) return 0;
  const nilaiAjb = getTotalNilaiAjb(detail?.progressPenjualan);
  const pct = getEffectiveMarketingPct(agent);
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
  return Math.round(totalFee * (pct / 100));
};

export const calcPotonganPphTotal = calcPotonganPphFromReferensi;

/**
 * Grand total transfer (penuh).
 * Non-PKP: total fee − pot. PPh
 * PKP: total fee (DPP + marketing) + PPN closing − pot. PPh
 */
export const calcGrandTotalTransfer = (
  totalFee: number,
  potonganPph: number,
  closingPpn = 0,
) => Math.max(0, totalFee + closingPpn - potonganPph);

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
  const jumlahSertifikatTanah = resolveJumlahSertifikatTanah(detail);
  const progress = detail?.progressPenjualan;
  const nilaiAjb = getTotalNilaiAjb(progress);
  const closingFull = getClosingFull(agent, feeRecord, detail);
  const fullMarketing = getFullMarketingFee(agent, detail);
  const closingSisa = Math.max(0, closingFull - sudah.closingNominal);

  const closing: PencairanKomponenInfo = {
    key: 'closing',
    label: 'Closing Fee',
    nominalPenuh: closingFull,
    nominalSisa: closingSisa,
    eligible: false,
    alasan: isAgentInHouse(agent)
      ? 'In-house — tanpa closing fee'
      : closingSisa > 0
        ? 'Belum memenuhi syarat closing fee'
        : 'Closing fee sudah diajukan',
  };

  if (!isAgentInHouse(agent) && closingSisa > 0) {
    if (!isBookingFeePaid(detail)) {
      closing.alasan = 'Booking fee belum lunas';
    } else if (isBatal) {
      closing.eligible = true;
      closing.alasan = 'Transaksi batal — closing fee dapat dicairkan';
    } else if (isCash && hasPpjbComplete(progress, jumlahSertifikatTanah)) {
      closing.eligible = true;
      closing.alasan = 'PPJB OK — closing siap';
    } else if (!isCash && hasSp3kComplete(detail?.progressPenjualan)) {
      closing.eligible = true;
      closing.alasan = 'SP3K OK — closing siap';
    } else if (isCash) {
      closing.alasan = 'Upload PPJB dulu';
    } else {
      closing.alasan = 'Upload SP3K dulu';
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
          hasPpjbComplete(progress, jumlahSertifikatTanah) &&
          nilaiAjb > 0;
        const ajbOk =
          buckets.ajbSisa > 0 &&
          hasPpjbComplete(progress, jumlahSertifikatTanah) &&
          hasAjbComplete(progress, jumlahSertifikatTanah) &&
          nilaiAjb > 0;

        if (ppjbOk || ajbOk) {
          marketing.eligible = true;
          const parts: string[] = [];
          if (ppjbOk) parts.push('50% PPJB');
          if (ajbOk) parts.push('50% AJB');
          marketing.alasan = `Bisa cair: ${parts.join(' + ')}`;
        } else if (buckets.ppjbSisa > 0 && !hasPpjbComplete(progress, jumlahSertifikatTanah)) {
          marketing.alasan = 'Upload PPJB dulu (50%)';
        } else if (buckets.ppjbSisa > 0 && nilaiAjb <= 0) {
          marketing.alasan = 'Isi nilai AJB di Progress Penjualan';
        } else if (buckets.ajbSisa > 0) {
          marketing.alasan = hasAjbComplete(progress, jumlahSertifikatTanah)
            ? 'Isi nilai AJB di Progress Penjualan'
            : 'Upload salinan AJB (sisa 50%)';
        } else {
          marketing.alasan = 'Belum memenuhi syarat komisi marketing';
        }
      }
    } else {
      marketing.nominalSisa = Math.max(0, fullMarketing - sudah.marketingNominal);

      if (marketing.nominalSisa <= 0) {
        marketing.alasan = 'Komisi marketing sudah diajukan semua';
      } else if (!hasSp3kComplete(detail?.progressPenjualan)) {
        marketing.alasan = 'Upload SP3K dulu';
      } else if (!hasAkadKreditComplete(progress, jumlahSertifikatTanah)) {
        marketing.alasan = 'Upload PPJB atau surat akad';
      } else if (nilaiAjb <= 0) {
        marketing.alasan = 'Isi nilai AJB di Progress Penjualan';
      } else {
        marketing.eligible = true;
        marketing.alasan = 'Syarat KPR OK — komisi siap';
      }
    }
  } else if (!isBookingFeePaid(detail)) {
    marketing.alasan = 'Booking fee belum lunas';
  } else if (isBatal) {
    marketing.alasan = 'Transaksi batal — komisi marketing tidak dicairkan';
  } else if (isCash && fullMarketing <= 0 && isBookingFeePaid(detail)) {
    marketing.alasan =
      nilaiAjb <= 0
        ? 'Isi nilai AJB di Progress Penjualan'
        : getMarketingFeeNotConfiguredReason(agent);
  } else if (!isCash && fullMarketing <= 0) {
    if (!hasSp3kComplete(detail?.progressPenjualan)) {
      marketing.alasan = 'Upload SP3K dulu';
    } else if (!hasAkadKreditComplete(progress, jumlahSertifikatTanah)) {
      marketing.alasan = 'Upload PPJB atau surat akad';
    } else if (nilaiAjb <= 0) {
      marketing.alasan = 'Isi nilai AJB di Progress Penjualan';
    } else {
      marketing.alasan = getMarketingFeeNotConfiguredReason(agent);
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
  const isBatal = isPenjualanBatal(detail?.status);
  const bookingPaid = isBookingFeePaid(detail);
  const closing = komponen.find((k) => k.key === 'closing');

  // Transaksi batal + booking lunas: closing fee yang relevan, bukan komisi marketing
  if (isBatal && bookingPaid && closing) {
    if (closing.nominalSisa > 0) {
      return closing.alasan ?? 'Transaksi batal — closing fee dapat dicairkan';
    }
    if (closing.nominalPenuh > 0) {
      return closing.alasan || 'Closing fee sudah diajukan';
    }
    if (!isAgentInHouse(agent)) {
      return isAgentPerusahaan(agent.type)
        ? 'Fee closing belum diatur di master perusahaan agent'
        : 'Fee closing belum diatur di data agent — edit agent dan isi kolom Fee Closing (Rp)';
    }
  }

  // Utamakan komponen yang masih punya sisa — jangan tampilkan "closing sudah" saat marketing masih pending
  const withSisa = komponen.filter((k) => k.nominalSisa > 0);
  if (withSisa.length > 0) {
    const blocked = withSisa.find((k) => !k.eligible);
    return blocked?.alasan ?? withSisa[0]?.alasan ?? null;
  }

  if (summary.jumlahPengajuan === 0) {
    const blocked = komponen.find(
      (k) =>
        !k.eligible &&
        (k.nominalPenuh > 0 || (k.key === 'marketing' && !isBatal)),
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
  return nextBlocked?.alasan ?? 'Menunggu syarat tahap berikutnya';
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
