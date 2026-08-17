import React, { useEffect, useRef, useCallback } from 'react';
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

/**
 * 无障碍对话框。
 * - role="dialog" + aria-modal + aria-labelledby：供读屏识别
 * - 打开时聚焦首元素、关闭归还原焦点
 * - Esc 关闭、焦点陷阱（focus trap）
 * - body 滚动锁定（打开时禁止背后页面滚动）
 * - 关闭时清理所有副作用/焦点
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = 'modal-title';
  const descId = 'modal-desc';

  // 打开：记录原焦点 + 聚焦首个可聚焦元素 + 锁定背景滚动
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusables[0] || panel).focus();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // 关闭：归还焦点到之前触发打开的元素
  useEffect(() => {
    if (!isOpen) {
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
    }
  }, [isOpen]);

  // Esc 关闭 + 焦点陷阱
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    // 焦点循环回绕
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 outline-none"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-xl ${type === 'confirm' ? 'bg-blue-50 text-[#264376]' : 'bg-amber-50 text-amber-600'}`}>
                {type === 'confirm' ? <HelpCircle size={24} /> : <AlertCircle size={24} />}
              </div>
              <div className="flex-1">
                <h3 id={titleId} className="text-sm font-black uppercase tracking-widest text-slate-900 mb-1">{title}</h3>
                <p id={descId} className="text-xs font-medium text-slate-500 leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="关闭"
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
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