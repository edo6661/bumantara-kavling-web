export const formatRupiah = (angka: string | number): string => {
  if (!angka) return "Rp 0";

  const numberValue = typeof angka === "string" ? parseFloat(angka) : angka;
  if (isNaN(numberValue)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberValue);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
