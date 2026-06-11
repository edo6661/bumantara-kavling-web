import { formatRupiah } from '../../utils/formatters';

type RekapPembayaranCellProps = {
  utama: number;
  terbayar?: number[];
  className?: string;
};

const RekapPembayaranCell = ({
  utama,
  terbayar = [],
  className = '',
}: RekapPembayaranCellProps) => {
  return (
    <div className={`text-right ${className}`}>
      <p className="font-semibold text-slate-800">{formatRupiah(utama)}</p>
      {terbayar.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
            Terbayar
          </p>
          <div className="space-y-0.5">
            {terbayar.map((nominal, index) => (
              <p key={`${nominal}-${index}`} className="text-[11px] text-emerald-600 font-medium">
                {formatRupiah(nominal)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type RekapTerbayarRingkasCellProps = {
  dpTerbayar: number;
  cicilanTerbayar: number;
};

export const RekapTerbayarRingkasCell = ({
  dpTerbayar,
  cicilanTerbayar,
}: RekapTerbayarRingkasCellProps) => {
  return (
    <div className="text-right space-y-1">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">DP</p>
        <p className="text-[12px] font-semibold text-emerald-600">
          {formatRupiah(dpTerbayar)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Harga Jual
        </p>
        <p className="text-[12px] font-semibold text-emerald-600">
          {formatRupiah(cicilanTerbayar)}
        </p>
      </div>
    </div>
  );
};

export default RekapPembayaranCell;
