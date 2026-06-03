import React from 'react';
interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  label?: string;
  error?: string;
  value: number | string;
  onValueChange: (name: string, value: number) => void;
  name: string;
  /** Tanpa margin bawah; ukuran lebih kecil untuk tabel / inline */
  compact?: boolean;
}
const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const CurrencyInput = ({
  label,
  error,
  value,
  onValueChange,
  name,
  compact = false,
  className,
  ...props
}: CurrencyInputProps) => {
  const numericValue = Math.round(Number(value));
  const isValidNumber = !Number.isNaN(numericValue) && value !== null && value !== undefined && value !== '';
  const displayValue = isValidNumber && numericValue !== 0 ? rupiahFormatter.format(numericValue) : '';
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const newNumericValue = rawValue ? Number(rawValue) : 0;
    onValueChange(name, newNumericValue);
  };
  const inputClass = compact
    ? `w-full min-w-[110px] pl-8 pr-2 py-1.5 text-xs tabular-nums rounded-lg border transition-all outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed ${
        error
          ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
          : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900'
      } ${className ?? ''}`
    : `w-full pl-11 pr-4 py-2.5 text-sm tabular-nums rounded-xl border transition-all duration-200 outline-none placeholder:text-slate-400 
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none
            ${error
              ? 'border-red-300 bg-red-50/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 shadow-sm'
            } ${className ?? ''}`;

  return (
    <div className={`flex flex-col gap-1.5 group w-full ${compact ? 'mb-0' : 'mb-4'}`}>
      {label && (
        <label
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ml-1 
            ${props.disabled ? 'text-slate-400' : 'text-slate-500 group-focus-within:text-indigo-600'}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 flex items-center pointer-events-none ${
            compact ? 'pl-2' : 'pl-4'
          }`}
        >
          <span
            className={`font-medium transition-colors ${
              compact ? 'text-[10px]' : 'text-sm'
            } ${props.disabled ? 'text-slate-400 opacity-60' : 'text-slate-400 group-focus-within:text-indigo-500'}`}
          >
            Rp
          </span>
        </div>
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleChange}
          autoComplete="off"
          className={inputClass}
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