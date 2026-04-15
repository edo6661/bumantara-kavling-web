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
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider transition-colors group-focus-within:text-black ml-1">
        {label}
      </label>
      <div className="relative">
        <select
          className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 outline-none cursor-pointer appearance-none shadow-sm/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200
            ${error
              ? 'border-red-400 bg-red-50/30 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
              : 'border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-black/5 focus:border-black text-slate-900 bg-white'
            }`}
          {...props}
        >
          <option value="" disabled>Pilih {label}...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="py-2">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom Arrow Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-focus-within:text-black transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;