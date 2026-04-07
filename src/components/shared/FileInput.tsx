import type { InputHTMLAttributes } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FileInput = ({ label, error, ...props }: FileInputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[13px] font-bold text-slate-600 uppercase tracking-wider transition-colors group-focus-within:text-black ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          className={`block w-full text-sm text-slate-500
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-l-xl file:border-0
            file:text-xs file:font-bold file:uppercase file:tracking-widest
            file:bg-slate-900 file:text-white
            hover:file:bg-black file:transition-all
            file:cursor-pointer cursor-pointer
            border rounded-xl shadow-sm/50 transition-all duration-300
            ${error
              ? 'border-red-400 bg-red-50/30 focus:ring-4 focus:ring-red-500/10 focus:border-red-500'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-4 focus:ring-black/5 focus:border-black'
            }
          `}
          {...props}
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-300 group-hover:text-slate-500 transition-colors">
          <UploadCloud size={18} />
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

export default FileInput;