import type { InputHTMLAttributes } from 'react';

interface FileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FileInput = ({ label, error, ...props }: FileInputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group">
      <label className="text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-black">
        {label}
      </label>
      <input
        type="file"
        className={`block w-full text-sm text-gray-600
          file:mr-4 file:py-2.5 file:px-4
          file:rounded-l-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-black file:text-white
          hover:file:bg-gray-800 file:transition-colors
          file:cursor-pointer cursor-pointer
          border rounded-lg shadow-sm transition-all duration-200
          ${error
            ? 'border-red-500 bg-red-50/30 focus:ring-4 focus:ring-red-500/15'
            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black'
          }
        `}
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

export default FileInput;