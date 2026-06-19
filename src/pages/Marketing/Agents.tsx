/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/shared/DataTable';
import PageLoader from '../PageLoader';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { useGetAgentsPaginated } from '../../hooks/queries/useAgent';
import { useAgentCrud } from '../../hooks/useAgentCrud';
import AgentPenjualanPencairanPanel from '../../components/marketing/AgentPenjualanPencairanPanel';
import AgentCrudModals from '../../components/marketing/AgentCrudModals';
import AgentActionButtons from '../../components/marketing/AgentActionButtons';
import type { AgentData } from '../../types/models/agent';
import type { AgentTypeFilter } from '../../components/marketing/agentCrudTypes';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

interface AgentsProps {
  agentType: AgentTypeFilter;
}

const Agents = ({ agentType }: AgentsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const orderBy = searchParams.get('orderBy') || '';
  const statusFilter = searchParams.get('status') || '';
  const limitParam = Number(searchParams.get('limit'));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;

  const { data: agentsResponse, isLoading } = useGetAgentsPaginated({
    page,
    limit,
    search,
    ...(orderBy ? { orderBy } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    type: agentType,
  });
  const agentData = agentsResponse?.items ?? [];
  const meta = agentsResponse?.meta;

  const crud = useAgentCrud({ defaultAgentType: agentType, lockAgentType: true });

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };
  const handlePageSizeChange = (newLimit: number) => {
    setSearchParams((prev) => {
      if (newLimit === DEFAULT_PAGE_SIZE) prev.delete('limit');
      else prev.set('limit', String(newLimit));
      prev.set('page', '1');
      return prev;
    });
  };
  const handleSearchChange = (newSearch: string) => {
    setSearchParams((prev) => {
      if (newSearch) prev.set('search', newSearch);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };
  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      if (e.target.value) prev.set('orderBy', e.target.value);
      else prev.delete('orderBy');
      prev.set('page', '1');
      return prev;
    });
  };

  const pageTitle = agentType === 'PRIBADI' ? 'Agent Pribadi' : 'Agent Perusahaan';

  const filterSelectClass =
    'w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none transition-all shadow-sm cursor-pointer';

  const tableToolbar = (
    <div className="relative group w-full sm:w-52">
      <select
        className={`${filterSelectClass} pl-9`}
        value={orderBy}
        onChange={handleSortChange}
        aria-label="Urutkan data"
      >
        <option value="">Agent Terbaru</option>
        <option value="nama:asc">Nama Agent (A-Z)</option>
      </select>
      <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500" />
      <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  );

  const columns = [
    { header: 'NIK', accessor: 'nik' },
    {
      header: 'Nama Agent',
      accessor: 'nama',
      render: (val: string) => <span className="font-bold text-slate-900">{val}</span>,
    },
    ...(agentType === 'PERUSAHAAN'
      ? [
          {
            header: 'Perusahaan',
            accessor: 'perusahaanAgent',
            render: (_: unknown, row: AgentData) => (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
                {row.perusahaanAgent?.nama || '-'}
              </span>
            ),
          },
        ]
      : []),
    {
      header: 'Status',
      accessor: 'status',
      render: (val: string) => {
        if (val === 'PENDING') {
          return (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-200 shadow-sm">
              Menunggu Approval
            </span>
          );
        }
        if (val === 'AKTIF') {
          return (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200 shadow-sm">
              Aktif
            </span>
          );
        }
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200 shadow-sm">
            {val}
          </span>
        );
      },
    },
    {
      header: 'Aksi',
      accessor: 'id',
      render: (_: any, row: AgentData) => <AgentActionButtons agent={row} crud={crud} />,
    },
  ];

  const expandedRowRender = (row: AgentData) => (
    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
        Riwayat Penjualan Agent: <span className="text-blue-600">{row.nama}</span>
      </h4>
      <AgentPenjualanPencairanPanel agent={row} />
    </div>
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title={pageTitle}
        columns={columns}
        data={agentData}
        onAdd={() => crud.openModal()}
        expandedRowRender={expandedRowRender}
        serverSide
        toolbarPrefix={tableToolbar}
        searchTerm={search}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={handlePageChange}
        pageSize={limit}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        onPageSizeChange={handlePageSizeChange}
      />
      <AgentCrudModals crud={crud} />
    </div>
  );
};

export default Agents;
