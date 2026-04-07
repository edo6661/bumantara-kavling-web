import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

const Select = ({ label, options, error, ...props }: SelectProps) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
          } bg-white text-black`}
        {...props}
      >
        <option value="" disabled>Pilih {label}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Select;