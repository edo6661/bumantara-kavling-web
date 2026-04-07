import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group">
      <label className="text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-black">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 outline-none text-gray-900 placeholder:text-gray-400 shadow-sm
          ${error
            ? 'border-red-500 bg-red-50/30 focus:ring-4 focus:ring-red-500/15 focus:border-red-500'
            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black'
          }`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-red-500 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;