import type { PemasukanPenjualanBucket, PemasukanTerbayarDetail } from '../../services/report.service';
import { formatRupiah } from '../../utils/formatters';

type PemasukanPenjualanCellProps = {
  bucket: PemasukanPenjualanBucket;
  onTerbayarClick: (detail: PemasukanTerbayarDetail) => void;
  showNominal?: boolean;
};

export const PemasukanNominalCell = ({ nominal }: { nominal: number }) => (
  <p className="font-semibold text-slate-800">{formatRupiah(nominal)}</p>
);

export const PemasukanSisaCell = ({ sisa }: { sisa: number }) => (
  <p className={`font-semibold ${sisa > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
    {formatRupiah(sisa)}
  </p>
);

export const PemasukanTotalTerbayarCell = ({ total }: { total: number }) => (
  <p className={`font-semibold ${total > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
    {formatRupiah(total)}
  </p>
);

const PemasukanPenjualanCell = ({
  bucket,
  onTerbayarClick,
  showNominal = false,
}: PemasukanPenjualanCellProps) => {
  return (
    <div className="text-right">
      {showNominal && (
        <p className="font-semibold text-slate-800 mb-1">{formatRupiah(bucket.nominal)}</p>
      )}
      {bucket.terbayar.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Belum ada</p>
      ) : (
        <div className="space-y-0.5">
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
        </div>
      )}
    </div>
  );
};

export default PemasukanPenjualanCell;
