
/* eslint-disable @typescript-eslint/no-explicit-any */
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import { formatDate, formatRupiah } from "../../utils/formatters";
import { useGetAuditLogs } from "../../hooks/queries/useAuditLog";
import { History, PlusCircle, Edit, Trash2 } from "lucide-react";


const flattenObject = (ob: any, prefix = ''): { key: string, value: any }[] => {
  let result: { key: string, value: any }[] = [];
  if (!ob || typeof ob !== 'object') return result;
  for (const [key, value] of Object.entries(ob)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result = result.concat(flattenObject(value, `${prefix}${key}.`));
    } else {
      result.push({ key: `${prefix}${key}`, value });
    }
  }
  return result;
};


const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';

  const lowerKey = key.toLowerCase();


  const currencyKeywords = ['harga', 'nominal', 'biaya', 'fee', 'plafon', 'diskon', 'dp', 'njop', 'ppn', 'pph', 'bphtb', 'uping'];
  const isCurrency = currencyKeywords.some(keyword => lowerKey.includes(keyword));

  if (isCurrency && !isNaN(Number(value))) {
    return formatRupiah(Number(value));
  }


  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return String(value);
};


const renderFlatList = (
  flatData: { key: string, value: any }[],
  compareData?: { key: string, value: any }[],
  renderType: 'before' | 'after' | 'create' = 'after'
) => {
  if (flatData.length === 0) {
    return <p className="text-xs text-slate-500 italic mt-2">Tidak ada data yang dicatat.</p>;
  }


  const compareDict = compareData?.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>);

  return (
    <ul className="text-xs text-slate-300 space-y-1 mt-2">
      {flatData.map((item, idx) => {
        let isChanged = false;
        let isMissingInCompare = false;

        if (compareDict) {
          if (Object.prototype.hasOwnProperty.call(compareDict, item.key)) {

            isChanged = String(compareDict[item.key]) !== String(item.value);
          } else {

            isChanged = true;
            isMissingInCompare = true;
          }
        }


        let rowClass = "flex flex-col xl:flex-row xl:gap-2 border-b border-slate-700/50 pb-1.5 mb-1.5 hover:bg-slate-700/30 px-2 pt-1.5 transition-colors rounded";
        let keyClass = "font-semibold text-slate-400 xl:w-1/3 shrink-0 capitalize flex items-center gap-1";
        let valClass = "text-white font-mono break-all font-medium";
        const badge = null;


        if (isChanged) {
          if (isMissingInCompare && renderType === 'after') {

            rowClass = "flex flex-col xl:flex-row xl:gap-2 border-b border-emerald-500/30 pb-1.5 mb-1.5 bg-emerald-500/10 px-2 pt-1.5 rounded transition-all";
            keyClass = "font-bold text-emerald-400 xl:w-1/3 shrink-0 capitalize flex items-center gap-1";
            valClass = "text-emerald-300 font-mono break-all font-bold";

          } else if (isMissingInCompare && renderType === 'before') {

            rowClass = "flex flex-col xl:flex-row xl:gap-2 border-b border-rose-500/30 pb-1.5 mb-1.5 bg-rose-500/10 px-2 pt-1.5 rounded transition-all";

          } else {

            rowClass = "flex flex-col xl:flex-row xl:gap-2 border-b border-amber-500/30 pb-1.5 mb-1.5 bg-amber-500/10 px-2 pt-1.5 rounded transition-all";
            keyClass = "font-bold text-amber-400 xl:w-1/3 shrink-0 capitalize flex items-center gap-1";
            valClass = "text-amber-300 font-mono break-all font-bold";
          }
        }

        return (
          <li key={idx} className={rowClass}>
            <span className={keyClass}>
              {item.key.replace(/\./g, ' ➔ ')}
              {badge}
            </span>
            <span className={valClass}>
              {formatValue(item.key, item.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const AuditLog = () => {
  const { data: logs = [], isLoading } = useGetAuditLogs();

  const columns = [
    { header: 'Waktu', accessor: 'createdAt', render: (val: string) => formatDate(val) },
    { header: 'Pelaku (User)', accessor: 'username', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    { header: 'Modul', accessor: 'entityName' },
    { header: 'ID Modul', accessor: 'entityId', render: (val: string) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded font-bold">{val}</span> },
    {
      header: 'Aksi',
      accessor: 'action',
      render: (val: string) => {
        if (val === 'CREATE') return <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-200"><PlusCircle size={12} /> CREATE</span>;
        if (val === 'UPDATE') return <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md w-fit border border-blue-200"><Edit size={12} /> UPDATE</span>;
        if (val === 'DELETE') return <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md w-fit border border-red-200"><Trash2 size={12} /> DELETE</span>;
        return val;
      }
    },
  ];

  const expandedRowRender = (row: any) => {
    const changes = row.changes || {};
    const afterData = changes.after || changes.input_raw;
    const flatAfter = flattenObject(afterData);

    let flatBefore: { key: string, value: any }[] = [];
    if (changes.before) {
      flatBefore = flattenObject(changes.before);
    }

    return (
      <div className="p-5 bg-slate-900 rounded-xl shadow-inner overflow-hidden animate-in fade-in duration-300">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
          <History size={16} className="text-blue-400" /> Detail Perubahan Data
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Render Data Sebelumnya (Before) */}
          {row.action === 'UPDATE' && changes.before && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-md">
              <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest bg-slate-700/50 inline-block px-2 py-1 rounded">
                Data Sebelumnya (Before)
              </p>
              {renderFlatList(flatBefore, flatAfter, 'before')}
            </div>
          )}
          {/* Render Data Baru (After) */}
          {afterData && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-md">
              <p className="text-[10px] text-emerald-400 font-bold mb-3 uppercase tracking-widest bg-emerald-400/10 inline-block px-2 py-1 rounded">
                {row.action === 'CREATE' ? 'Data Dibuat (Data)' : 'Data Baru (After)'}
              </p>
              {renderFlatList(flatAfter, row.action === 'UPDATE' ? flatBefore : undefined, row.action === 'CREATE' ? 'create' : 'after')}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DataTable
        title="Audit Log Sistem"
        columns={columns}
        data={logs}
        expandedRowRender={expandedRowRender}
      />
    </div>
  );
};

export default AuditLog;