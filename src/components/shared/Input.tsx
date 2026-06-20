import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const inputBaseClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none placeholder:text-slate-400 text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none';

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className={`flex flex-col gap-1.5 mb-4 group w-full ${className ?? ''}`}>
      {label && (
        <label
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors ml-1 
            ${props.disabled ? 'text-slate-400' : 'text-slate-500 group-focus-within:text-blue-600'}`}
        >
          {label}
        </label>
      )}
      <input
        className={`${inputBaseClass} ${
          error
            ? 'border-red-300 bg-red-50/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
            : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm'
        }`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;