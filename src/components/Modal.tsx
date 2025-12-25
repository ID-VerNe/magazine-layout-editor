import React from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-xl ${type === 'confirm' ? 'bg-blue-50 text-[#264376]' : 'bg-amber-50 text-amber-600'}`}>
                {type === 'confirm' ? <HelpCircle size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-1">{title}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{message}</p>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
            {type === 'confirm' && (
              <button 
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="px-6 py-2 bg-[#264376] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#264376]/20 hover:brightness-110 transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
