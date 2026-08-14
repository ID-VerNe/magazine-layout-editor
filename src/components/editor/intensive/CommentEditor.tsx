import React, { memo, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Bold, Italic, X } from 'lucide-react';
import { ExternalAnnotation, CustomFont } from '../../../types';

interface CommentEditorProps {
  annotation: ExternalAnnotation;
  onUpdate: (id: string, html: string) => void;
  onRemove: (id: string) => void;
  hideSeq?: boolean;
  customFonts: CustomFont[];
  onSetAnnotationFontSize: (id: string, size: string) => void;
}

export const CommentEditor = memo(({
  annotation,
  onUpdate,
  onRemove,
  hideSeq,
  customFonts,
  onSetAnnotationFontSize,
}: CommentEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const lastExternalCommentRef = useRef<string | undefined>(annotation.comment);
  const lastFlushedCommentRef = useRef<string | undefined>(annotation.comment);
  const onUpdateRef = useRef(onUpdate);

  onUpdateRef.current = onUpdate;

  // Initialize content on mount only.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(annotation.comment || '');
    }
  }, []);

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        if (currentHtml !== lastFlushedCommentRef.current) {
          onUpdateRef.current(annotation.id, currentHtml);
        }
      }
    };
  }, [annotation.id]);

  // Sync external comment changes only when the user isn't actively editing.
  useEffect(() => {
    if (!editorRef.current) return;
    if (isFocusedRef.current) {
      lastExternalCommentRef.current = annotation.comment;
      return;
    }
    if (annotation.comment !== lastExternalCommentRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(annotation.comment || '');
      lastExternalCommentRef.current = annotation.comment;
      lastFlushedCommentRef.current = annotation.comment;
    }
  }, [annotation.comment]);

  const flushNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastFlushedCommentRef.current = html;
      onUpdate(annotation.id, html);
    }
  }, [annotation.id, onUpdate]);

  const handleInput = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        lastFlushedCommentRef.current = html;
        onUpdate(annotation.id, html);
      }
    }, 200);
  }, [annotation.id, onUpdate]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    flushNow();
  }, [flushNow]);

  const toggleMark = useCallback((tag: 'b' | 'i') => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const elem = container.nodeType === Node.ELEMENT_NODE
      ? container as HTMLElement
      : container.parentElement;
    const selector = tag === 'b' ? 'b,strong' : 'i,em';
    const formatted = elem?.closest(selector);

    if (formatted) {
      const parent = formatted.parentNode;
      if (parent) {
        while (formatted.firstChild) parent.insertBefore(formatted.firstChild, formatted);
        parent.removeChild(formatted);
      }
    } else {
      const markEl = document.createElement(tag);
      try {
        range.surroundContents(markEl);
      } catch {
        document.execCommand(tag === 'b' ? 'bold' : 'italic', false);
      }
    }
    el.focus();
    handleInput();
  }, [handleInput]);

  const applyStyle = useCallback((prop: 'fontSize' | 'fontFamily', value: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style[prop] = value;
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
    handleInput();
  }, [handleInput]);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3 shadow-sm">
      <div className="bg-slate-50 text-xs font-bold text-[#367237] p-2 border-b flex justify-between items-center">
        <span>{!hideSeq && `[${annotation.seq}] `}{annotation.text}</span>
        <div className="flex items-center gap-1">
          <select
            value={annotation.fontSize || ''}
            onChange={(e) => onSetAnnotationFontSize(annotation.id, e.target.value)}
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-amber-50 text-slate-500 focus:outline-none cursor-pointer"
            title="标注本体字号（右侧批注区显示的标注文字）"
          >
            <option value="">注字</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>
          <div className="w-px h-3 bg-slate-300 mx-0.5" />
          <button
            onMouseDown={(e) => { e.preventDefault(); toggleMark('b'); }}
            className="p-1 rounded hover:bg-slate-200 text-slate-500"
            title="Bold"
          >
            <Bold size={12} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); toggleMark('i'); }}
            className="p-1 rounded hover:bg-slate-200 text-slate-500"
            title="Italic"
          >
            <Italic size={12} />
          </button>
          <select
            defaultValue=""
            onChange={(e) => { const v = e.target.value; if (v) applyStyle('fontSize', v); e.target.value = ''; }}
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white text-slate-500 focus:outline-none cursor-pointer"
            title="Font size"
          >
            <option value="" disabled>Size</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>
          <select
            defaultValue=""
            onChange={(e) => { const v = e.target.value; if (v) applyStyle('fontFamily', v); e.target.value = ''; }}
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white text-slate-500 focus:outline-none cursor-pointer max-w-[110px]"
            title="Font family"
          >
            <option value="" disabled>Font</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Crimson Pro', serif">Crimson Pro</option>
            <option value="'Noto Serif SC', serif">Noto Serif SC</option>
            {customFonts.map(f => (
              <option key={f.family} value={f.family}>{f.name}</option>
            ))}
          </select>
          <div className="w-px h-3 bg-slate-300 mx-0.5" />
          <button
            onClick={() => onRemove(annotation.id)}
            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
            title="Remove annotation"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        className="p-2 prose prose-sm max-w-none focus:outline-none min-h-[60px]"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={handleBlur}
      />
    </div>
  );
}, (prev, next) => {
  return prev.annotation.id === next.annotation.id
    && prev.annotation.seq === next.annotation.seq
    && prev.annotation.comment === next.annotation.comment
    && prev.annotation.text === next.annotation.text
    && prev.annotation.fontSize === next.annotation.fontSize
    && prev.hideSeq === next.hideSeq
    && prev.customFonts === next.customFonts
    && prev.onSetAnnotationFontSize === next.onSetAnnotationFontSize
    && prev.onUpdate === next.onUpdate
    && prev.onRemove === next.onRemove;
});
