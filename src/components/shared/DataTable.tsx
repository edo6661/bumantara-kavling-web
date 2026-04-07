/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Inbox } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
        <h2 className="text-lg font-heading font-bold text-gray-900">{title}</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black hover:border-gray-300 transition-all shadow-sm text-gray-900"
            />
          </div>

          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm font-semibold cursor-pointer active:scale-[0.98]"
            >
              <Plus size={18} />
              Tambah
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100 whitespace-nowrap">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 font-semibold tracking-wider">
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 font-semibold tracking-wider text-center w-28">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="bg-white hover:bg-gray-50/80 transition-colors duration-150"
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
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-3">
                      <Inbox size={32} strokeWidth={1.5} className="text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">
                      {searchTerm ? 'Data tidak ditemukan' : 'Belum ada data'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">
                      {searchTerm
                        ? `Pencarian "${searchTerm}" tidak cocok dengan data manapun. Coba gunakan kata kunci lain.`
                        : 'Silakan klik tombol "Tambah" di atas untuk memasukkan data baru ke dalam tabel.'}
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