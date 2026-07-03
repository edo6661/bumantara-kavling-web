import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLoader from '../PageLoader';
import Modal from '../../components/shared/Modal';
import { formatDate, formatRupiah } from '../../utils/formatters';
import { handleApiError } from '../../utils/errorHandler';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  XCircle,
} from 'lucide-react';
import {
  useApproveSpk,
  useGetSpkPaginated,
  useRejectSpk,
} from '../../hooks/queries/useSpk';
import type { SpkData } from '../../services/spk.service';
import CollapsibleDetailSection from '../../components/shared/CollapsibleDetailSection';

const thClass =
  'px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200 whitespace-nowrap';
const tdClass = 'px-4 py-3 text-sm text-slate-800 align-middle border-b border-slate-100';

const jenisLabel = (jenis: SpkData['jenis']) =>
  jenis === 'INFRASTRUKTUR' ? 'Infrastruktur' : 'Rumah';

const ApproveSpk = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [detailItem, setDetailItem] = useState<SpkData | null>(null);
  const [rejectItem, setRejectItem] = useState<SpkData | null>(null);
  const [catatanPenolakan, setCatatanPenolakan] = useState('');

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const limit = 50;

  const { data: response, isLoading } = useGetSpkPaginated({
    page,
    limit,
    search: search || undefined,
    statusApproval: 'PENDING',
    orderBy: 'id:desc',
  });

  const approveMutation = useApproveSpk();
  const rejectMutation = useRejectSpk();

  const items = useMemo(
    () => (response?.items ?? []).filter((row) => row.statusApproval === 'PENDING'),
    [response?.items],
  );
  const meta = response?.meta;

  const handleSearchChange = (newSearch: string) => {
    setSearchParams((prev) => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  const handleApprove = async (row: SpkData) => {
    const confirmed = window.confirm(
      `Setujui SPK ${row.noSpk} — ${row.judulPekerjaan}?\n\nSetelah disetujui, mandor dapat mengajukan pembayaran.`,
    );
    if (!confirmed) return;
    try {
      await approveMutation.mutateAsync(row.id);
      alert('SPK berhasil disetujui.');
      if (detailItem?.id === row.id) setDetailItem(null);
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    const confirmed = window.confirm(
      `Tolak SPK ${rejectItem.noSpk}? Kavling terkait akan dilepas dari SPK ini.`,
    );
    if (!confirmed) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectItem.id,
        catatanPenolakan: catatanPenolakan.trim() || undefined,
      });
      alert('SPK ditolak.');
      setRejectItem(null);
      setCatatanPenolakan('');
      if (detailItem?.id === rejectItem.id) setDetailItem(null);
    } catch (error) {
      alert(handleApiError(error).message);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Approve SPK</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review SPK baru yang diajukan sebelum mandor dapat mengajukan pembayaran termin, kasbon,
            atau upah.
          </p>
        </div>

        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-50"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} /> Filter
            </span>
            {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {isFilterExpanded && (
            <div className="p-4 flex items-center gap-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Cari SPK / Mandor / Judul
              </label>
              <input
                type="text"
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchChange((e.target as HTMLInputElement).value);
                }}
                placeholder="Tekan Enter untuk cari..."
                className="mt-1 w-full max-w-md px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Tidak ada SPK yang menunggu persetujuan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>No. SPK</th>
                  <th className={thClass}>Jenis</th>
                  <th className={thClass}>Judul Pekerjaan</th>
                  <th className={thClass}>Mandor</th>
                  <th className={thClass}>Nilai Kontrak</th>
                  <th className={thClass}>Diajukan</th>
                  <th className={thClass}>Oleh</th>
                  <th className={thClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className={`${tdClass} font-bold text-slate-900`}>{row.noSpk}</td>
                    <td className={tdClass}>
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded">
                        {jenisLabel(row.jenis)}
                      </span>
                    </td>
                    <td className={`${tdClass} text-xs text-slate-600 max-w-[220px]`}>
                      <span className="line-clamp-2">{row.judulPekerjaan}</span>
                    </td>
                    <td className={`${tdClass} font-medium`}>{row.mandor.username}</td>
                    <td className={`${tdClass} font-bold tabular-nums`}>
                      {formatRupiah(row.nilaiKontrak)}
                    </td>
                    <td className={`${tdClass} text-xs text-slate-500`}>
                      {formatDate(row.createdAt)}
                    </td>
                    <td className={`${tdClass} text-xs text-slate-600`}>
                      {row.diajukanOleh?.username ?? '-'}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailItem(row)}
                          className="px-2.5 py-1 text-[9px] font-bold uppercase border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleApprove(row)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={11} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectItem(row);
                            setCatatanPenolakan('');
                          }}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={11} />
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Halaman {meta.page} / {meta.totalPages}
            </span>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={detailItem ? `Detail SPK — ${detailItem.noSpk}` : 'Detail SPK'}
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4 max-h-[min(74vh,660px)] overflow-y-auto pr-1 -mr-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Judul</p>
                <p className="font-semibold text-black">{detailItem.judulPekerjaan}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Mandor</p>
                <p className="font-semibold text-black">{detailItem.mandor.username}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Nilai Kontrak</p>
                <p className="font-bold text-blue-700">{formatRupiah(detailItem.nilaiKontrak)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tanggal SPK</p>
                <p className="font-semibold text-black">{formatDate(detailItem.tanggalSpk)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded">
                  <Clock size={10} /> Menunggu Persetujuan
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Diajukan Oleh</p>
                <p className="font-semibold text-black">
                  {detailItem.diajukanOleh?.username ?? '-'}
                </p>
              </div>
            </div>

            {detailItem.jenis === 'RUMAH' && detailItem.kavlingItems.length > 0 && (
              <CollapsibleDetailSection title={`Kavling (${detailItem.kavlingItems.length})`} defaultOpen>
                <ul className="space-y-1 text-xs">
                  {detailItem.kavlingItems.map((k) => (
                    <li key={k.kavlingId} className="text-slate-700">
                      Blok {k.blok} · Unit {k.nomorUnit} · {k.customerNama}
                    </li>
                  ))}
                </ul>
              </CollapsibleDetailSection>
            )}

            {detailItem.jenis === 'INFRASTRUKTUR' && (
              <CollapsibleDetailSection title="Infrastruktur" defaultOpen>
                <div className="text-xs space-y-1">
                  {detailItem.zona && (
                    <p>
                      <span className="font-bold text-slate-500">Zona:</span> {detailItem.zona.nama}
                    </p>
                  )}
                  {detailItem.pekerjaanInfraItems.map((p) => (
                    <p key={p.id}>{p.nama}</p>
                  ))}
                </div>
              </CollapsibleDetailSection>
            )}

            {detailItem.notesPekerjaan && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {detailItem.notesPekerjaan}
                </p>
              </div>
            )}

            {(detailItem.fileSpk || detailItem.fileRab) && (
              <CollapsibleDetailSection title="Dokumen" defaultOpen>
                <div className="flex flex-col gap-2">
                  {detailItem.fileSpk && (
                    <a
                      href={detailItem.fileSpk}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                    >
                      <FileText size={16} />
                      Lihat Dokumen SPK
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {detailItem.fileRab && (
                    <a
                      href={detailItem.fileRab}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline"
                    >
                      <FileText size={16} />
                      Lihat Dokumen RAB
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </CollapsibleDetailSection>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleApprove(detailItem)}
                disabled={approveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Approve SPK
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectItem(detailItem);
                  setCatatanPenolakan('');
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle size={18} />
                Tolak
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!rejectItem}
        onClose={() => {
          setRejectItem(null);
          setCatatanPenolakan('');
        }}
        title={rejectItem ? `Tolak SPK — ${rejectItem.noSpk}` : 'Tolak SPK'}
        size="md"
      >
        {rejectItem && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Kavling yang terhubung ke SPK ini akan dilepas. Berikan alasan penolakan (opsional):
            </p>
            <textarea
              value={catatanPenolakan}
              onChange={(e) => setCatatanPenolakan(e.target.value)}
              rows={4}
              placeholder="Alasan penolakan..."
              className="text-black w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={rejectMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle size={18} />
              Konfirmasi Penolakan
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApproveSpk;
