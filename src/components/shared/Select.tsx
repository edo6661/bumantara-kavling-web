import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

const Select = ({ label, options, error, ...props }: SelectProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      {label && (
        <label
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ml-1 
            ${props.disabled ? 'text-slate-400' : 'text-slate-500 group-focus-within:text-indigo-600'}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`peer w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none appearance-none
            disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none
            ${props.disabled ? '' : 'cursor-pointer'}
            ${error
              ? 'border-red-300 bg-red-50/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 shadow-sm'
            }`}
          {...props}
        >
          <option value="" disabled>Pilih {label || 'Opsi'}...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="py-2">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 peer-focus:text-indigo-500 peer-disabled:opacity-40 transition-colors">
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