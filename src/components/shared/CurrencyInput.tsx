import React from 'react';
interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  label: string;
  error?: string;
  value: number | string;
  onValueChange: (name: string, value: number) => void;
  name: string;
}
const CurrencyInput = ({ label, error, value, onValueChange, name, ...props }: CurrencyInputProps) => {
  const displayValue = value === 0 || value === '' ? '' : new Intl.NumberFormat('id-ID').format(Number(value));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numericValue = rawValue ? Number(rawValue) : 0;
    onValueChange(name, numericValue);
  };
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider transition-colors group-focus-within:text-black ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-slate-500 font-medium text-sm">Rp</span>
        </div>
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleChange}
          className={`w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-300 outline-none placeholder:text-slate-400 shadow-sm/50 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200
            ${error
              ? 'border-red-400 bg-red-50/30 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
              : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black text-slate-900 bg-white'
            }`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs font-medium text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};
export default CurrencyInput;