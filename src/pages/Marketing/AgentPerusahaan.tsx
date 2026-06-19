import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import PageLoader from '../PageLoader';
import { formatRupiah } from '../../utils/formatters';
import { useGetPerusahaanAgents } from '../../hooks/queries/usePerusahaanAgent';
import { useGetAgentsPaginated } from '../../hooks/queries/useAgent';
import { useAgentCrud } from '../../hooks/useAgentCrud';
import AgentPenjualanPencairanPanel from '../../components/marketing/AgentPenjualanPencairanPanel';
import AgentCrudModals from '../../components/marketing/AgentCrudModals';
import AgentActionButtons from '../../components/marketing/AgentActionButtons';
import type { PerusahaanAgentData } from '../../services/perusahaanAgent.service';
import type { AgentData } from '../../types/models/agent';

const AgentPerusahaan = () => {
  const { data: perusahaanList = [], isLoading: loadingPerusahaan } = useGetPerusahaanAgents();
  const { data: agentsResponse, isLoading: loadingAgents } = useGetAgentsPaginated({
    type: 'PERUSAHAAN',
    limit: 500,
    page: 1,
  });

  const crud = useAgentCrud({ defaultAgentType: 'PERUSAHAAN', lockAgentType: true });

  const agents = agentsResponse?.items ?? [];

  const agentsByPerusahaan = useMemo(() => {
    const map = new Map<number, AgentData[]>();
    agents.forEach((agent) => {
      const perusahaanId = agent.perusahaanAgent?.id;
      if (!perusahaanId) return;
      const list = map.get(perusahaanId) ?? [];
      list.push(agent);
      map.set(perusahaanId, list);
    });
    return map;
  }, [agents]);

  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

  const toggleAgent = (perusahaanId: number, agentId: number) => {
    const key = `${perusahaanId}-${agentId}`;
    setExpandedAgents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const columns = [
    {
      header: 'Nama Perusahaan',
      accessor: 'nama',
      render: (val: string) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      header: 'NPWP',
      accessor: 'npwp',
      render: (val: string | null) => <span className="font-mono text-xs">{val || '-'}</span>,
    },
    {
      header: 'Fee Marketing',
      accessor: 'feeMarketingPct',
      render: (val: number | null) => (
        <span className="text-xs tabular-nums">{val != null ? `${val}%` : '-'}</span>
      ),
    },
    {
      header: 'Fee Closing',
      accessor: 'feeClosingNominal',
      render: (val: number | null, row: PerusahaanAgentData) => (
        <div className="text-xs tabular-nums">
          <span>{val != null ? formatRupiah(val) : '-'}</span>
          {row.isPkp && val != null ? (
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Termasuk PPN 11%</p>
          ) : null}
        </div>
      ),
    },
    {
      header: 'PKP',
      accessor: 'isPkp',
      render: (val: boolean | undefined) => (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {val ? 'PKP' : 'Non-PKP'}
        </span>
      ),
    },
    {
      header: 'Jumlah Agent',
      accessor: 'id',
      render: (_: unknown, row: PerusahaanAgentData) => {
        const count = agentsByPerusahaan.get(row.id)?.length ?? 0;
        return (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            {count} agent
          </span>
        );
      },
    },
  ];

  const renderAgentStatus = (status: string) => {
    if (status === 'PENDING') {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-200">
          Menunggu Approval
        </span>
      );
    }
    if (status === 'AKTIF') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200">
          Aktif
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200">
        {status}
      </span>
    );
  };

  const expandedRowRender = (perusahaan: PerusahaanAgentData) => {
    const companyAgents = agentsByPerusahaan.get(perusahaan.id) ?? [];

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <h4 className="text-sm font-bold text-slate-800">
            Daftar Agent — <span className="text-blue-600">{perusahaan.nama}</span>
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              crud.openModal(undefined, { perusahaanAgentId: perusahaan.id });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            Tambah Agent
          </button>
        </div>

        {companyAgents.length > 0 ? (
          <div className="space-y-2">
            {companyAgents.map((agent) => {
              const expandKey = `${perusahaan.id}-${agent.id}`;
              const isAgentExpanded = !!expandedAgents[expandKey];
              const saleCount = agent.penjualan?.length ?? 0;

              return (
                <div
                  key={agent.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                >
                  <div className="flex items-stretch gap-2 px-2 py-2 sm:px-3">
                    <button
                      type="button"
                      onClick={() => toggleAgent(perusahaan.id, agent.id)}
                      className="flex flex-1 min-w-0 items-center gap-3 px-2 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                    >
                      <span className="text-slate-400 shrink-0">
                        {isAgentExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Nama Agent</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{agent.nama}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">NIK</p>
                          <p className="text-sm font-medium text-slate-700 tabular-nums">{agent.nik}</p>
                        </div>
                        <div>{renderAgentStatus(agent.status)}</div>
                        <div>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {saleCount} penjualan
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center shrink-0 pr-1">
                      <AgentActionButtons agent={agent} crud={crud} stopPropagation />
                    </div>
                  </div>

                  {isAgentExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                      <h5 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">
                        Riwayat Penjualan — {agent.nama}
                      </h5>
                      <AgentPenjualanPencairanPanel agent={agent} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic py-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada agent terdaftar di perusahaan ini.
          </p>
        )}
      </div>
    );
  };

  if (loadingPerusahaan || loadingAgents) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Agent Perusahaan"
        columns={columns}
        data={perusahaanList}
        expandedRowRender={expandedRowRender}
        searchPlaceholder="Cari perusahaan..."
        filterRow={(row, term) => {
          const lower = term.toLowerCase();
          return (
            row.nama.toLowerCase().includes(lower) ||
            (row.npwp ?? '').toLowerCase().includes(lower)
          );
        }}
      />
      <AgentCrudModals crud={crud} />
    </div>
  );
};

export default AgentPerusahaan;
