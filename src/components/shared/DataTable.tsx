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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Header & Toolbar */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
        <div>
          <h2 className="text-lg font-heading font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">
            Total {filteredData.length} data ditemukan
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-black transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black hover:bg-white hover:border-gray-300 transition-all shadow-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 hover:shadow-md transition-all duration-200 font-medium text-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase font-semibold tracking-wider border-b border-gray-200">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-center whitespace-nowrap w-28">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50/50 transition-colors duration-150 group"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 flex justify-center gap-2 whitespace-nowrap">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                    <div className="bg-gray-50 p-4 rounded-full mb-4 ring-8 ring-gray-50/50">
                      <FileX2 size={32} strokeWidth={1.5} className="text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {searchTerm ? 'Data tidak ditemukan' : 'Belum ada data'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {searchTerm
                        ? `Pencarian untuk "${searchTerm}" tidak membuahkan hasil. Coba kata kunci lain.`
                        : 'Silakan tambahkan data baru dengan mengklik tombol "Tambah Data" di pojok kanan atas.'}
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