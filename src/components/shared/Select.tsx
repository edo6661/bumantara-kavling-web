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
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        className={`w-full px-4 py-2.5 text-sm rounded-lg border shadow-sm transition-all duration-200 outline-none bg-white text-gray-900 cursor-pointer appearance-none
          ${error
            ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:ring-4 focus:ring-black/5 focus:border-black'
          }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
        {...props}
      >
        <option value="" disabled className="text-gray-500">Pilih {label}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default Select;