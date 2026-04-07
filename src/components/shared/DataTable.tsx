/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
  return (
    <div className="bg-white rounded-radius-card shadow-sm border border-sidebar-border overflow-hidden">
      <div className="p-5 border-b border-sidebar-border flex justify-between items-center">
        <h2 className="text-lg font-heading font-semibold text-gray-900">{title}</h2>
        {/* Render tombol Tambah hanya jika onAdd tersedia */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-radius-btn hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
          >
            <Plus size={16} />
            Tambah
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-sidebar-border">
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
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-sidebar-border hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-gray-900">
                      {/* Cek apakah ada fungsi render custom, jika tidak tampilkan data asli */}
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 flex justify-center gap-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
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
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  Belum ada data.
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