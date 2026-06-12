import type { PemasukanPenjualanBucket, PemasukanTerbayarDetail } from '../../services/report.service';
import { formatRupiah } from '../../utils/formatters';

type PemasukanPenjualanCellProps = {
  bucket: PemasukanPenjualanBucket;
  onTerbayarClick: (detail: PemasukanTerbayarDetail) => void;
};

export const PemasukanNominalCell = ({ nominal }: { nominal: number }) => (
  <p className="font-semibold text-slate-800">{formatRupiah(nominal)}</p>
);

const PemasukanPenjualanCell = ({ bucket, onTerbayarClick }: PemasukanPenjualanCellProps) => {
  const showTotalTerbayar = bucket.terbayar.length > 1;
  const showSisa = bucket.sisa > 0;
  const isEmpty = bucket.terbayar.length === 0 && !showSisa;

  if (isEmpty) {
    return <p className="text-right text-[11px] text-slate-400 italic">-</p>;
  }

  return (
    <div className="text-right space-y-0.5">
      {bucket.terbayar.map((item, index) => (
        <button
          key={`${item.tagihanId}-${index}`}
          type="button"
          onClick={() => onTerbayarClick(item)}
          className="block w-full text-right text-[11px] text-emerald-600 font-medium hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
          title={`${item.pembayaran} — klik untuk detail`}
        >
          {formatRupiah(item.nominal)}
        </button>
      ))}

      {showTotalTerbayar && (
        <p
          className="text-[11px] font-bold text-emerald-600 pt-1 border-t border-slate-100"
          title="Total dibayar"
        >
          {formatRupiah(bucket.totalTerbayar)}
        </p>
      )}

      {showSisa && (
        <p
          className={`text-[11px] font-bold text-red-600 ${showTotalTerbayar ? '' : bucket.terbayar.length > 0 ? 'pt-1 border-t border-slate-100' : ''}`}
          title="Sisa yang belum dibayar"
        >
          {formatRupiah(bucket.sisa)}
        </p>
      )}
    </div>
  );
};

export default PemasukanPenjualanCell;
