export type TagihanTujuan =
  | "BOOKING_FEE"
  | "DP"
  | "HARGA_JUAL"
  | "LAINNYA";

export const TAGIHAN_TUJUAN_OPTIONS: { value: TagihanTujuan; label: string }[] =
  [
    { value: "BOOKING_FEE", label: "Booking fee" },
    { value: "DP", label: "Down payment / uang muka" },
    { value: "HARGA_JUAL", label: "Cicilan harga jual (pokok)" },
    { value: "LAINNYA", label: "Biaya tambahan / lainnya" },
  ];

export const tagihanTujuanShortLabel: Record<TagihanTujuan, string> = {
  BOOKING_FEE: "Booking",
  DP: "DP",
  HARGA_JUAL: "Harga jual",
  LAINNYA: "Lainnya",
};

/** Sinkron dengan inferensi di backend untuk data/cache lama. */
export function effectiveTagihanTujuan(row: {
  tujuan?: string | null;
  pembayaran: string;
}): TagihanTujuan {
  const raw = row.tujuan as TagihanTujuan | undefined;
  if (raw && raw !== "LAINNYA") return raw;

  const p = row.pembayaran.trim().toLowerCase();
  if (p.includes("booking")) return "BOOKING_FEE";
  if (/^cicilan ke-\d+$/.test(p)) return "HARGA_JUAL";
  if (
    p.includes("down payment") ||
    p.includes("uang muka") ||
    (p.includes("dp") && !p.includes("booking"))
  ) {
    return "DP";
  }
  return "LAINNYA";
}
