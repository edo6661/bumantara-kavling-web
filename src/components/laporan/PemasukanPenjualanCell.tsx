import { useState, type MouseEvent } from 'react';
import type { PemasukanPenjualanBucket } from '../../services/report.service';
import { formatTanpaDesimal } from '../../utils/formatters';

export type PemasukanTerbayarVariant = 'dp' | 'bertahap' | 'kpr';

const VARIANT_STYLES: Record<
  PemasukanTerbayarVariant,
  { payment: string; total: string }
> = {
  dp: {
    payment: 'text-blue-600',
    total: 'text-blue-700',
  },
  bertahap: {
    payment: 'text-purple-700',
    total: 'text-purple-800',
  },
  kpr: {
    payment: 'text-pink-700',
    total: 'text-pink-800',
  },
};

type PemasukanPenjualanCellProps = {
  bucket: PemasukanPenjualanBucket;
  variant?: PemasukanTerbayarVariant;
};

export const PemasukanNominalCell = ({ nominal }: { nominal: number }) => (
  <p className="font-semibold text-slate-800 tabular-nums">{formatTanpaDesimal(nominal)}</p>
);

const PemasukanPenjualanCell = ({
  bucket,
  variant = 'dp',
}: PemasukanPenjualanCellProps) => {
  const [expanded, setExpanded] = useState(false);
  const styles = VARIANT_STYLES[variant];

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
          className={`text-[11px] font-medium tabular-nums ${styles.payment}`}
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
          className={`text-[11px] font-bold pt-1 border-t border-slate-200/80 tabular-nums ${styles.total}`}
          title="Total dibayar"
        >
          {formatTanpaDesimal(bucket.totalTerbayar)}
        </p>
      )}

      {showSisa && expanded && (
        <p
          className="text-[11px] font-bold text-orange-600 tabular-nums pt-1 border-t border-slate-200/80"
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
  variant = 'dp',
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
      <PemasukanPenjualanCell bucket={bucket} variant={variant} />
    </td>
  );
};

export default PemasukanPenjualanCell;
