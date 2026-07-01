export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthDateRange(): { from: string; to: string } {
  const now = new Date();
  const from = toIsoDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = toIsoDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { from, to };
}

export function formatPenjualanPeriodeLabel(dateFrom: string, dateTo: string): string {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);

  if (dateFrom === dateTo) {
    return from.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  if (sameMonth) {
    const monthYear = to.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return `${from.getDate()}–${to.getDate()} ${monthYear}`;
  }

  if (sameYear) {
    const fromLabel = from.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const toLabel = to.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${fromLabel} – ${toLabel}`;
  }

  const fromLabel = from.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const toLabel = to.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${fromLabel} – ${toLabel}`;
}

export function formatPenjualanPeriodeTitle(dateFrom: string, dateTo: string): string {
  return `Penjualan ${formatPenjualanPeriodeLabel(dateFrom, dateTo)}`;
}

export function monthRangeFromYearMonth(year: number, month: number): {
  from: string;
  to: string;
} {
  const from = toIsoDateString(new Date(year, month - 1, 1));
  const to = toIsoDateString(new Date(year, month, 0));
  return { from, to };
}
