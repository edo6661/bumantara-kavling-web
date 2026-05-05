/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileX2, ChevronRight, ChevronDown, ChevronLeft, Eye } from 'lucide-react';

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
  onDetail?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  expandedRowRender?: (row: any) => React.ReactNode;
  serverSide?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DataTable = ({
  title, columns, data, onAdd, onDetail, onEdit, onDelete, expandedRowRender,
  serverSide = false, searchTerm = '', onSearchChange, page = 1, totalPages = 1, onPageChange
}: DataTableProps) => {

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (serverSide && onSearchChange) {
      const timeoutId = setTimeout(() => {
        if (localSearchTerm !== searchTerm) {
          onSearchChange(localSearchTerm);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localSearchTerm, serverSide, onSearchChange, searchTerm]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows((prev) => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  };

  const filteredData = useMemo(() => {
    if (serverSide) return data;
    if (!localSearchTerm) return data;
    const lowercasedTerm = localSearchTerm.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.accessor];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, localSearchTerm, columns, serverSide]);

  const hasActions = !!(onDetail || onEdit || onDelete);
  const totalCols = columns.length + (expandedRowRender ? 1 : 0) + (hasActions ? 1 : 0);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {/* {!serverSide && (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {filteredData.length} Data
              </span>
            )} */}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Cari data..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm cursor-pointer shadow-sm active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
              {expandedRowRender && <th className="px-4 py-3.5 w-10 text-center"></th>}
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3.5 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-3.5 text-center whitespace-nowrap w-24">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => {
                const isExpanded = !!expandedRows[rowIndex];
                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      onClick={() => {
                        if (expandedRowRender) toggleRow(rowIndex);
                      }}
                      className={`transition-all duration-200 group ${expandedRowRender ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50'} ${isExpanded ? 'bg-indigo-50/30' : 'bg-white'}`}
                    >
                      {expandedRowRender && (
                        <td className="px-4 py-4 text-center text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                      )}
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 text-slate-700 whitespace-nowrap font-medium">
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {onDetail && (
                              <button
                                onClick={() => onDetail(row)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                                title="Detail"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && expandedRowRender && (
                      <tr className="bg-slate-50/30 border-t-0">
                        <td colSpan={totalCols} className="px-6 py-5 border-b border-slate-100">
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {expandedRowRender(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={totalCols} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center max-w-xs mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-50/50">
                      <FileX2 size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-semibold mb-1">Data tidak ditemukan</h3>
                    <p className="text-slate-500 text-sm">
                      Kami tidak dapat menemukan data yang Anda cari.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {serverSide && totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-500">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((num, idx) => (
              num === "..." ? (
                <span key={idx} className="px-2 text-slate-400 font-bold">...</span>
              ) : (
                <button
                  key={idx}
                  onClick={() => onPageChange?.(num as number)}
                  className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${page === num
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {num}
                </button>
              )
            ))}

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;