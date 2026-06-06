import { useMemo } from 'react';
import BuktiFileThumbnail from '../shared/BuktiFileThumbnail';
import { formatDate, formatRupiah } from '../../utils/formatters';
import {
  groupKasbonBarisForDisplay,
  kasbonSupplierDisplayName,
  type KasbonDisplayBon,
  type KasbonDisplaySupplier,
} from '../../utils/kasbonBarisDisplay';
import type { SpkPembayaranKasbonBarisData } from '../../services/spkPembayaran.service';

const thClass =
  'px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-orange-50 border-b border-orange-100 whitespace-nowrap';
const tdClass =
  'px-3 py-2 text-xs text-slate-800 align-top border-b border-orange-50/80';

interface KasbonGroupedTableProps {
  baris: SpkPembayaranKasbonBarisData[];
  onPreviewFoto?: (url: string) => void;
}

const supplierRowSpan = (supplier: KasbonDisplaySupplier) =>
  supplier.bons.reduce((sum, bon) => sum + bon.items.length, 0);

const KasbonGroupedTable = ({ baris, onPreviewFoto }: KasbonGroupedTableProps) => {
  const groups = useMemo(() => groupKasbonBarisForDisplay(baris), [baris]);
  const totalBons = groups.reduce((sum, g) => sum + g.bons.length, 0);

  if (!baris.length) {
    return <p className="text-xs text-slate-400 italic">Tidak ada rincian kasbon.</p>;
  }

  const renderFotoCell = (bon: KasbonDisplayBon, rowSpan: number) => {
    if (!bon.fotoBon) {
      return (
        <td rowSpan={rowSpan} className={`${tdClass} text-slate-400`}>
          —
        </td>
      );
    }
    return (
      <td rowSpan={rowSpan} className={tdClass}>
        <BuktiFileThumbnail
          url={bon.fotoBon}
          onClick={() => onPreviewFoto?.(bon.fotoBon!)}
          className="w-12 h-9"
        />
      </td>
    );
  };

  return (
    <div className="rounded-xl border border-orange-200 overflow-hidden bg-orange-50/15">
      <div className="px-3 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wide">
          Detail Kasbon Material
        </p>
        <p className="text-[10px] text-orange-700/80 font-medium">
          {groups.length} supplier · {totalBons} bon · {baris.length} item
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[560px] bg-white">
          <thead>
            <tr>
              <th className={thClass}>Supplier</th>
              <th className={thClass}>Tgl PO</th>
              <th className={`${thClass} w-16`}>Foto Bon</th>
              <th className={thClass}>Item</th>
              <th className={`${thClass} text-right`}>Nominal</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((supplier) => {
              const sRowSpan = supplierRowSpan(supplier);
              let supplierRendered = false;

              return supplier.bons.flatMap((bon) =>
                bon.items.map((item, itemIdx) => {
                  const isFirstSupplierRow = !supplierRendered;
                  if (isFirstSupplierRow) supplierRendered = true;
                  const isFirstBonRow = itemIdx === 0;
                  const bonRowSpan = bon.items.length;

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/30">
                      {isFirstSupplierRow && (
                        <td
                          rowSpan={sRowSpan}
                          className={`${tdClass} font-bold text-slate-900 bg-orange-50/40 border-r border-orange-100`}
                        >
                          {kasbonSupplierDisplayName(supplier.namaSupplier)}
                          <p className="text-[10px] font-semibold text-orange-800 mt-1 tabular-nums">
                            {formatRupiah(supplier.total)}
                          </p>
                        </td>
                      )}
                      {isFirstBonRow && (
                        <td
                          rowSpan={bonRowSpan}
                          className={`${tdClass} whitespace-nowrap text-slate-600`}
                        >
                          {bon.tanggalIso ? formatDate(bon.tanggalPo) : '—'}
                        </td>
                      )}
                      {isFirstBonRow && renderFotoCell(bon, bonRowSpan)}
                      <td className={`${tdClass} font-medium text-slate-800`}>{item.keterangan}</td>
                      <td
                        className={`${tdClass} font-bold text-orange-800 text-right tabular-nums whitespace-nowrap`}
                      >
                        {formatRupiah(item.nominal)}
                      </td>
                    </tr>
                  );
                }),
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KasbonGroupedTable;
