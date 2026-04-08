/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, FileX2 } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

const DataTable = ({ title, columns, data, onAdd, onEdit, onDelete }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowercasedTerm = searchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.accessor];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, searchTerm, columns]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md/10">
      {/* Header & Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/50 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-200/50">
              {filteredData.length} Data
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Kelola dan pantau informasi operasional secara real-time.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm/5 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-5 py-2 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 font-bold text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={3} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-bold tracking-widest border-b border-slate-100">
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 whitespace-nowrap font-bold">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-center whitespace-nowrap w-24">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-slate-50/80 transition-colors duration-200 group"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center max-w-xs mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-slate-50/30">
                      <FileX2 size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">Data tidak ditemukan</h3>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">
                      Kami tidak dapat menemukan data yang Anda cari. Coba ubah kata kunci atau tambahkan data baru.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;