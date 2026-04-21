/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import DataTable from "../../components/shared/DataTable";
import PageLoader from "../PageLoader";
import { formatDate } from "../../utils/formatters";
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
const renderFlatList = (flatData: { key: string, value: any }[]) => {
  if (flatData.length === 0) {
    return <p className="text-xs text-slate-500 italic mt-2">Tidak ada data yang dicatat atau diubah.</p>;
  }
  return (
    <ul className="text-xs text-slate-300 space-y-1 mt-2">
      {flatData.map((item, idx) => (
        <li key={idx} className="flex flex-col xl:flex-row xl:gap-2 border-b border-slate-700/50 pb-1.5 mb-1.5 hover:bg-slate-700/30 transition-colors">
          <span className="font-semibold text-slate-400 xl:w-1/3 shrink-0 capitalize">
            {item.key.replace(/\./g, ' ➔ ')}
          </span>
          <span className="text-white font-mono break-all font-medium">
            {typeof item.value === 'boolean'
              ? (item.value ? 'Ya' : 'Tidak')
              : String(item.value)}
          </span>
        </li>
      ))}
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
    const afterKeys = flatAfter.map(item => item.key);
    let flatBefore: { key: string, value: any }[] = [];
    if (changes.before) {
      flatBefore = flattenObject(changes.before);
      if (row.action === 'UPDATE') {
        flatBefore = flatBefore.filter(item => afterKeys.includes(item.key));
      }
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
              <p className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-widest bg-red-400/10 inline-block px-2 py-1 rounded">
                Data Sebelumnya (Before)
              </p>
              {renderFlatList(flatBefore)}
            </div>
          )}
          {/* Render Data Baru (After) */}
          {afterData && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-md">
              <p className="text-[10px] text-emerald-400 font-bold mb-3 uppercase tracking-widest bg-emerald-400/10 inline-block px-2 py-1 rounded">
                {row.action === 'CREATE' ? 'Data Dibuat (Data)' : 'Data Baru (After)'}
              </p>
              {renderFlatList(flatAfter)}
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