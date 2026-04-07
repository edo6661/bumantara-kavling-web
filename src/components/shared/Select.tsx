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
    <div className="flex flex-col gap-1.5 mb-4 group">
      <label className="text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-black">
        {label}
      </label>
      <select
        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 outline-none text-gray-900 cursor-pointer appearance-none shadow-sm
          ${error
            ? 'border-red-500 bg-red-50/30 focus:ring-4 focus:ring-red-500/15 focus:border-red-500'
            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black'
          }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25em 1.25em',
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
      {error && (
        <span className="text-xs font-medium text-red-500 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;