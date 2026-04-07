import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl ring-1 ring-slate-200 overflow-hidden"
          >
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Formulir Penginputan Data</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;