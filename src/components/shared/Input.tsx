import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      {label && (
        <label
          className={`text-xs font-semibold uppercase tracking-wider transition-colors ml-1 
            ${props.disabled ? 'text-slate-400' : 'text-slate-500 group-focus-within:text-slate-900'}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none placeholder:text-slate-400 
          disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none
          ${error
            ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900'
            : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-900 shadow-sm'
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