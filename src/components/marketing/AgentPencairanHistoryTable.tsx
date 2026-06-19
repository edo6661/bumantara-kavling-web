import BuktiFileThumbnail from '../shared/BuktiFileThumbnail';
import { formatDate, formatRupiah } from '../../utils/formatters';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import { sortPencairanRecords } from '../../utils/agentPencairan';
import { getAgentPencairanInvoiceUrls } from '../../utils/agentPencairanInvoice';
import { CheckCircle2, Clock } from 'lucide-react';

const thClass =
  'px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdClass = 'px-3 py-2.5 text-sm text-slate-800 align-middle border-b border-slate-100';

interface AgentPencairanHistoryTableProps {
  records: AgentPencairanData[];
  compact?: boolean;
  showBukti?: boolean;
  showInvoice?: boolean;
  onPreviewBukti?: (url: string) => void;
  onPreviewInvoice?: (url: string) => void;
  emptyMessage?: string;
}

const AgentPencairanHistoryTable = ({
  records,
  compact = false,
  showBukti = true,
  showInvoice = false,
  onPreviewBukti,
  onPreviewInvoice,
  emptyMessage = 'Belum ada riwayat pencairan.',
}: AgentPencairanHistoryTableProps) => {
  const sorted = sortPencairanRecords(records);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className={`w-full border-collapse ${compact ? 'min-w-[720px]' : 'min-w-[960px]'}`}>
        <thead>
          <tr>
            <th className={thClass}>Tahap</th>
            <th className={`${thClass} text-right`}>Closing</th>
            <th className={`${thClass} text-right`}>Marketing</th>
            <th className={`${thClass} text-right`}>Pot. PPh</th>
            <th className={`${thClass} text-right`}>Total</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Diajukan</th>
            {!compact && <th className={thClass}>Dibayar</th>}
            {showInvoice && <th className={thClass}>Invoice</th>}
            {showBukti && <th className={thClass}>Bukti</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const paid = row.status === 'SUDAH_DIBAYAR';
            const invoiceUrls = getAgentPencairanInvoiceUrls(row);
            return (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className={tdClass}>
                  <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                    {row.tahap}
                  </span>
                </td>
                <td className={`${tdClass} text-right tabular-nums`}>
                  {formatRupiah(row.closingNominal)}
                </td>
                <td className={`${tdClass} text-right tabular-nums`}>
                  {formatRupiah(row.marketingNominal)}
                </td>
                <td className={`${tdClass} text-right tabular-nums text-red-600`}>
                  {formatRupiah(row.potonganPph)}
                </td>
                <td className={`${tdClass} text-right font-bold text-emerald-700 tabular-nums`}>
                  {formatRupiah(row.totalNominal)}
                </td>
                <td className={tdClass}>
                  {paid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-green-100 text-green-700 rounded">
                      <CheckCircle2 size={10} /> Terbayar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-100 text-amber-700 rounded">
                      <Clock size={10} /> Menunggu
                    </span>
                  )}
                </td>
                <td className={`${tdClass} text-xs text-slate-500`}>
                  <p>{row.diajukanOleh?.username ?? '-'}</p>
                  <p>{formatDate(row.createdAt)}</p>
                </td>
                {!compact && (
                  <td className={`${tdClass} text-xs text-slate-500`}>
                    {paid ? (
                      <>
                        <p>{row.dibayarOleh?.username ?? '-'}</p>
                        <p>{row.tanggalPembayaran ? formatDate(row.tanggalPembayaran) : formatDate(row.updatedAt)}</p>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                {showInvoice && (
                  <td className={tdClass}>
                    {invoiceUrls.length > 0 && onPreviewInvoice ? (
                      <div className="flex flex-wrap gap-1">
                        {invoiceUrls.map((url) => (
                          <BuktiFileThumbnail
                            key={url}
                            url={url}
                            onClick={() => onPreviewInvoice(url)}
                            className="w-12 h-8"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                )}
                {showBukti && (
                  <td className={tdClass}>
                    {row.buktiPembayaran && onPreviewBukti ? (
                      <BuktiFileThumbnail
                        url={row.buktiPembayaran}
                        onClick={() => onPreviewBukti(row.buktiPembayaran!)}
                        className="w-12 h-8"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AgentPencairanHistoryTable;
