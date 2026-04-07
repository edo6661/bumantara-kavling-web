import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${error
          ? 'border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:ring-blue-200'
          } bg-white text-black`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;