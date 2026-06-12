import { useState, type MouseEvent } from 'react';
import type { PemasukanPenjualanBucket } from '../../services/report.service';
import { formatTanpaDesimal } from '../../utils/formatters';

/** Dipakai untuk kompatibilitas pemanggil; warna terbayar diseragamkan hijau/oranye. */
export type PemasukanTerbayarVariant = 'dp' | 'bertahap' | 'kpr';

const PAYMENT_COLORS = {
  terbayar: 'text-emerald-600',
  totalTerbayar: 'text-emerald-900 font-black',
  sisa: 'text-orange-600 font-bold',
} as const;

type PemasukanPenjualanCellProps = {
  bucket: PemasukanPenjualanBucket;
  variant?: PemasukanTerbayarVariant;
};

export const PemasukanNominalCell = ({ nominal }: { nominal: number }) => (
  <p className="font-semibold text-slate-800 tabular-nums">{formatTanpaDesimal(nominal)}</p>
);

const PemasukanPenjualanCell = ({ bucket }: PemasukanPenjualanCellProps) => {
  const [expanded, setExpanded] = useState(false);

  const showTotalTerbayar = bucket.terbayar.length > 1;
  const showSisa = bucket.sisa > 0;
  const hasMultiplePayments = bucket.terbayar.length > 1;
  const visiblePayments =
    expanded || !hasMultiplePayments ? bucket.terbayar : bucket.terbayar.slice(0, 1);

  if (bucket.terbayar.length === 0) {
    return <p className="text-right text-[11px] text-slate-400 italic">-</p>;
  }

  const stopRowClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="text-right space-y-0.5 pointer-events-none">
      {visiblePayments.map((item, index) => (
        <p
          key={`${item.tagihanId}-${index}`}
          className={`text-[11px] font-medium tabular-nums ${PAYMENT_COLORS.terbayar}`}
        >
          {formatTanpaDesimal(item.nominal)}
        </p>
      ))}

      {hasMultiplePayments && !expanded && (
        <button
          type="button"
          onClick={(e) => {
            stopRowClick(e);
            setExpanded(true);
          }}
          className="pointer-events-auto text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
        >
          Selengkapnya
        </button>
      )}

      {hasMultiplePayments && expanded && (
        <button
          type="button"
          onClick={(e) => {
            stopRowClick(e);
            setExpanded(false);
          }}
          className="pointer-events-auto text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
        >
          Sembunyikan
        </button>
      )}

      {showTotalTerbayar && expanded && (
        <p
          className={`text-[11px] pt-1 border-t border-slate-200/80 tabular-nums ${PAYMENT_COLORS.totalTerbayar}`}
          title="Total dibayar"
        >
          {formatTanpaDesimal(bucket.totalTerbayar)}
        </p>
      )}

      {showSisa && expanded && (
        <p
          className={`text-[11px] tabular-nums pt-1 border-t border-slate-200/80 ${PAYMENT_COLORS.sisa}`}
          title="Sisa yang harus dibayar"
        >
          {formatTanpaDesimal(bucket.sisa)}
        </p>
      )}
    </div>
  );
};

type PemasukanTerbayarTdProps = {
  bucket: PemasukanPenjualanBucket;
  variant?: PemasukanTerbayarVariant;
  onOpen: () => void;
  className?: string;
};

export const PemasukanTerbayarTd = ({
  bucket,
  onOpen,
  className = '',
}: PemasukanTerbayarTdProps) => {
  const clickable = bucket.terbayar.length > 0;

  return (
    <td
      className={`py-3 px-3 align-top transition-colors ${className} ${
        clickable
          ? 'cursor-pointer hover:bg-slate-100/80 active:bg-slate-100'
          : ''
      }`}
      onClick={clickable ? onOpen : undefined}
      title={clickable ? 'Klik untuk detail semua pembayaran' : undefined}
    >
      <PemasukanPenjualanCell bucket={bucket} />
    </td>
  );
};

export default PemasukanPenjualanCell;
