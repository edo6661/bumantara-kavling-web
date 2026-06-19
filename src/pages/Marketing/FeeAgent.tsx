import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import PageLoader from '../PageLoader';
import AgentPencairanHistoryTable from '../../components/marketing/AgentPencairanHistoryTable';
import { formatRupiah } from '../../utils/formatters';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAllAgentPencairan } from '../../hooks/queries/useAgentPencairan';
import type { AgentPencairanData } from '../../services/agentPencairan.service';
import { summarizePencairanHistory } from '../../utils/agentPencairan';

interface GroupedAgentPencairan {
  agentId: number;
  namaAgent: string;
  jumlahPengajuan: number;
  jumlahTerbayar: number;
  jumlahMenunggu: number;
  totalTerbayar: number;
  totalMenunggu: number;
  records: AgentPencairanData[];
}

const FeeAgent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const statusFilter = searchParams.get('status') ?? 'ALL';
  const search = searchParams.get('search') ?? '';

  const { data: pencairanData = [], isLoading } = useGetAllAgentPencairan({
    status: statusFilter === 'ALL' ? 'ALL' : (statusFilter as 'MENUNGGU_PEMBAYARAN' | 'SUDAH_DIBAYAR'),
  });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pencairanData;

    return pencairanData.filter((row) => {
      const haystack = [
        row.agent?.nama,
        row.penjualan?.customer?.nama,
        row.penjualan?.noTransaksi,
        row.penjualan?.kavling?.blok,
        row.penjualan?.kavling?.nomorUnit,
        row.tahap,
        row.diajukanOleh?.username,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [pencairanData, search]);

  const groupedData = useMemo(() => {
    const groups = new Map<number, GroupedAgentPencairan>();

    filteredData.forEach((row) => {
      const agentId = row.agentId;
      const existing = groups.get(agentId);

      if (!existing) {
        groups.set(agentId, {
          agentId,
          namaAgent: row.agent?.nama ?? `Agent #${agentId}`,
          jumlahPengajuan: 0,
          jumlahTerbayar: 0,
          jumlahMenunggu: 0,
          totalTerbayar: 0,
          totalMenunggu: 0,
          records: [],
        });
      }

      const group = groups.get(agentId)!;
      group.records.push(row);
      group.jumlahPengajuan += 1;

      if (row.status === 'SUDAH_DIBAYAR') {
        group.jumlahTerbayar += 1;
        group.totalTerbayar += Number(row.totalNominal);
      } else {
        group.jumlahMenunggu += 1;
        group.totalMenunggu += Number(row.totalNominal);
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.namaAgent.localeCompare(b.namaAgent, 'id'),
    );
  }, [filteredData]);

  const handleStatusFilterChange = (value: string) => {
    setSearchParams((prev) => {
      if (value === 'ALL') prev.delete('status');
      else prev.set('status', value);
      return prev;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      if (value.trim()) prev.set('search', value.trim());
      else prev.delete('search');
      return prev;
    });
  };

  const columns = [
    {
      header: 'Nama Agent',
      accessor: 'namaAgent',
      render: (val: string) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      header: 'Pengajuan',
      accessor: 'jumlahPengajuan',
      render: (val: number) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
          {val}x
        </span>
      ),
    },
    {
      header: 'Terbayar',
      accessor: 'totalTerbayar',
      render: (_: number, row: GroupedAgentPencairan) => (
        <div>
          <p className="font-semibold text-green-700 tabular-nums">{formatRupiah(row.totalTerbayar)}</p>
          <p className="text-[10px] text-slate-500">{row.jumlahTerbayar} pengajuan</p>
        </div>
      ),
    },
    {
      header: 'Menunggu',
      accessor: 'totalMenunggu',
      render: (_: number, row: GroupedAgentPencairan) => (
        <div>
          <p className="font-semibold text-amber-700 tabular-nums">{formatRupiah(row.totalMenunggu)}</p>
          <p className="text-[10px] text-slate-500">{row.jumlahMenunggu} pengajuan</p>
        </div>
      ),
    },
  ];

  const expandedRowRender = (row: GroupedAgentPencairan) => {
    const byPenjualan = new Map<number, AgentPencairanData[]>();
    row.records.forEach((record) => {
      const list = byPenjualan.get(record.penjualanId) ?? [];
      list.push(record);
      byPenjualan.set(record.penjualanId, list);
    });

    return (
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
          Riwayat pencairan: <span className="text-blue-600">{row.namaAgent}</span>
        </h4>

        {Array.from(byPenjualan.entries()).map(([penjualanId, records]) => {
          const first = records[0];
          const customer = first?.penjualan?.customer?.nama ?? '-';
          const kavling = first?.penjualan?.kavling;
          const kavlingLabel = kavling ? `${kavling.blok} ${kavling.nomorUnit}` : '-';
          const summary = summarizePencairanHistory(records);

          return (
            <div key={penjualanId} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{customer}</p>
                  <p className="text-xs text-slate-500">
                    Kavling {kavlingLabel} · {first?.penjualan?.noTransaksi ?? '-'}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  {summary.jumlahPengajuan} pengajuan · terbayar{' '}
                  <span className="font-semibold text-green-700 tabular-nums">
                    {formatRupiah(summary.totalNominalTerbayar)}
                  </span>
                </p>
              </div>
              <AgentPencairanHistoryTable
                records={records}
                compact
                onPreviewBukti={setPreviewUrl}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} /> Filter
          </span>
          {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isFilterExpanded && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="ALL">Semua</option>
                <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                <option value="SUDAH_DIBAYAR">Sudah Dibayar</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                Cari agent / customer / kavling
              </label>
              <input
                type="text"
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchChange((e.target as HTMLInputElement).value);
                }}
                placeholder="Tekan Enter untuk cari..."
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <DataTable
        title="Riwayat Pencairan Agent"
        columns={columns}
        data={groupedData}
        expandedRowRender={expandedRowRender}
      />

      <p className="text-xs text-slate-500 px-1">
        Satu penjualan bisa memiliki beberapa pengajuan (tahap PPJB dan AJB, atau pengajuan
        bertahap). Jika semua syarat sudah lengkap, closing fee dan komisi marketing juga bisa
        diajukan sekaligus dalam satu pengajuan.
      </p>

      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Bukti Pembayaran">
        {previewUrl && (
          <div className="flex justify-center">
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[60vh] rounded-lg" title="Bukti PDF" />
            ) : (
              <img src={previewUrl} alt="Bukti" className="max-h-[70vh] rounded-lg" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeAgent;
