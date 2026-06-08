/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileX2, ChevronRight, ChevronDown, ChevronLeft, Eye } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
  /** Default true — set false for multi-line cells (e.g. kavling lists). */
  nowrap?: boolean;
  /** Tailwind min-width class, e.g. `min-w-[260px]` */
  minWidth?: string;
  /** Extra classes on header and body cells for this column. */
  className?: string;
  /** Default true — set false to allow multi-line column headers. */
  headerNowrap?: boolean;
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
  onRowClick?: (row: any) => void;
  serverSide?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  toolbarPrefix?: React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Custom client-side search; when set, replaces default column accessor matching. */
  filterRow?: (row: any, searchTerm: string) => boolean;
  searchPlaceholder?: string;
  /** Tighter cell padding for wide tables. */
  dense?: boolean;
  /** Always show action buttons instead of revealing on row hover. */
  alwaysShowActions?: boolean;
}

const DataTable = ({
  title, columns, data, onAdd, onDetail, onEdit, onDelete, expandedRowRender, onRowClick,
  serverSide = false, searchTerm = '', onSearchChange, page = 1, totalPages = 1, onPageChange,
  toolbarPrefix, pageSize = 10, pageSizeOptions = [10, 25, 50, 100], onPageSizeChange,
  filterRow, searchPlaceholder = 'Cari...', dense = false, alwaysShowActions = false,
}: DataTableProps) => {

  const cellPad = dense ? 'px-3 py-2.5' : 'px-6 py-4';
  const headPad = dense ? 'px-3 py-3' : 'px-6 py-3.5';

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

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

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const filteredData = useMemo(() => {
    if (serverSide) return data;
    const term = localSearchTerm.trim();
    if (!term) return data;
    if (filterRow) {
      return data.filter((row) => filterRow(row, term));
    }
    const lowercasedTerm = term.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.accessor];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [data, localSearchTerm, columns, serverSide, filterRow]);

  const hasActions = !!(onDetail || onEdit || onDelete);
  const totalCols = columns.length + (expandedRowRender ? 1 : 0) + (hasActions ? 1 : 0);

  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
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
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sticky top-0 z-30 bg-white">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {toolbarPrefix}
          <div className="relative w-full sm:w-72 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder={searchPlaceholder}
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
              
            </button>
          )}
        </div>
      </div>

      <div className="overflow-auto custom-scrollbar max-h-[65vh]">
        <table className="w-full text-sm text-left border-collapse table-auto">
          <thead className="sticky top-0 z-20 shadow-sm ring-1 ring-slate-200">
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              {expandedRowRender && <th className="px-4 py-3.5 w-10 text-center bg-slate-50"></th>}
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`${headPad} bg-slate-50 align-bottom ${col.minWidth ?? ''} ${col.className ?? ''} ${col.headerNowrap === false ? 'whitespace-normal leading-snug' : 'whitespace-nowrap'}`}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className={`${headPad} text-center whitespace-nowrap w-20 bg-slate-50`}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => {
                const rowId = String(row.id ?? rowIndex);
                const isExpanded = !!expandedRows[rowId];

                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      onClick={() => {
                        if (expandedRowRender) toggleRow(rowId);
                        else onRowClick?.(row);
                      }}
                      className={`transition-all duration-200 group ${expandedRowRender || onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50'} ${isExpanded ? 'bg-indigo-50/30' : 'bg-white'}`}
                    >
                      {expandedRowRender && (
                        <td className="px-4 py-4 text-center text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                      )}
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className={`${cellPad} text-slate-700 font-medium align-top ${col.minWidth ?? ''} ${col.className ?? ''} ${col.nowrap === false ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                        >
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                        </td>
                      ))}
                      {hasActions && (
                        <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                          <div className={`flex justify-center gap-2 ${alwaysShowActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'}`}>
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

      {serverSide && (totalPages > 1 || onPageSizeChange) && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white z-20">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            {onPageSizeChange && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-sm"
                  aria-label="Jumlah data per halaman"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;