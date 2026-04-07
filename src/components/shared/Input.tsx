import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        className={`w-full px-4 py-2.5 text-sm rounded-lg border shadow-sm transition-all duration-200 outline-none bg-white text-gray-900 placeholder:text-gray-400
          ${error
            ? 'border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:ring-4 focus:ring-black/5 focus:border-black'
          }`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;