import type { InputHTMLAttributes } from 'react';

interface FileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FileInput = ({ label, error, ...props }: FileInputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type="file"
        className={`block w-full text-sm text-gray-600
          file:mr-4 file:py-2.5 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-black file:text-white
          hover:file:bg-gray-800 file:transition-colors
          file:cursor-pointer cursor-pointer
          border rounded-lg shadow-sm
          focus:outline-none transition-all duration-200 bg-white
          ${error
            ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
            : 'border-gray-200 hover:border-gray-300 focus:ring-4 focus:ring-black/5 focus:border-black'
          }
        `}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
    </div>
  );
};

export default FileInput;