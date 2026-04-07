
import { Plus } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  onAdd: () => void;
}

const DataTable = ({ title, columns, data, onAdd }: DataTableProps) => {
  return (
    <div className="bg-gray-300 rounded-radius-card shadow-sm border border-sidebar-border overflow-hidden">
      <div className="p-5 border-b border-sidebar-border flex justify-between items-center">
        <h2 className="text-lg font-heading font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-radius-btn hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
        >
          <Plus size={16} />
          Tambah
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-900 uppercase border-b border-sidebar-border">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 font-semibold tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-sidebar-border hover:bg-gray-500 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-gray-900">
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-900">
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