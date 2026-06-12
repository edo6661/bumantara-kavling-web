import { useState } from 'react';
import type { PemasukanPenjualanBucket, PemasukanTerbayarDetail } from '../../services/report.service';
import { formatTanpaDesimal } from '../../utils/formatters';

export type PemasukanTerbayarVariant = 'dp' | 'bertahap' | 'kpr';

const VARIANT_STYLES: Record<
  PemasukanTerbayarVariant,
  { payment: string; total: string }
> = {
  dp: {
    payment: 'text-blue-600 hover:text-blue-800',
    total: 'text-blue-700',
  },
  bertahap: {
    payment: 'text-violet-600 hover:text-violet-800',
    total: 'text-violet-700',
  },
  kpr: {
    payment: 'text-pink-600 hover:text-pink-800',
    total: 'text-pink-700',
  },
};

type PemasukanPenjualanCellProps = {
  bucket: PemasukanPenjualanBucket;
  onTerbayarClick: (detail: PemasukanTerbayarDetail) => void;
  variant?: PemasukanTerbayarVariant;
};

export const PemasukanNominalCell = ({ nominal }: { nominal: number }) => (
  <p className="font-semibold text-slate-800 tabular-nums">{formatTanpaDesimal(nominal)}</p>
);

const PemasukanPenjualanCell = ({
  bucket,
  onTerbayarClick,
  variant = 'dp',
}: PemasukanPenjualanCellProps) => {
  const [expanded, setExpanded] = useState(false);
  const styles = VARIANT_STYLES[variant];

  const showTotalTerbayar = bucket.terbayar.length > 1;
  const hasMultiplePayments = bucket.terbayar.length > 1;
  const visiblePayments =
    expanded || !hasMultiplePayments ? bucket.terbayar : bucket.terbayar.slice(0, 1);
  const isEmpty = bucket.terbayar.length === 0;

  if (isEmpty) {
    return <p className="text-right text-[11px] text-slate-400 italic">-</p>;
  }

  return (
    <div className="text-right space-y-0.5">
      {visiblePayments.map((item, index) => (
        <button
          key={`${item.tagihanId}-${index}`}
          type="button"
          onClick={() => onTerbayarClick(item)}
          className={`block w-full text-right text-[11px] font-medium hover:underline cursor-pointer transition-colors tabular-nums ${styles.payment}`}
          title={`${item.pembayaran} — klik untuk detail`}
        >
          {formatTanpaDesimal(item.nominal)}
        </button>
      ))}

      {hasMultiplePayments && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
        >
          see more
        </button>
      )}

      {hasMultiplePayments && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
        >
          see less
        </button>
      )}

      {showTotalTerbayar && (expanded || !hasMultiplePayments) && (
        <p
          className={`text-[11px] font-bold pt-1 border-t border-slate-100 tabular-nums ${styles.total}`}
          title="Total dibayar"
        >
          {formatTanpaDesimal(bucket.totalTerbayar)}
        </p>
      )}
    </div>
  );
};

export default PemasukanPenjualanCell;
