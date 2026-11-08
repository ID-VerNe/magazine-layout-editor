import React, { memo, useRef, useEffect, useCallback, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ExternalAnnotation, CustomFont } from '../../../types';
import { sanitizeComment } from '../../../utils/sanitize';

interface CommentEditorProps {
  annotation: ExternalAnnotation;
  onUpdate: (id: string, html: string) => void;
  onRemove: (id: string) => void;
  hideSeq?: boolean;
  customFonts: CustomFont[];
  onSetAnnotationFontSize: (id: string, size: string) => void;
  /** 修改批注词条的展示文本（可填原形，如把 is/are 改为 be）；传空串表示恢复原文 */
  onSetAnnotationDisplayText: (id: string, text: string) => void;
}

// 富文本评论的消毒统一走 src/utils/sanitize.ts 的 sanitizeComment（白名单见该文件）

export const CommentEditor = memo(({
  annotation,
  onUpdate,
  onRemove,
  hideSeq,
  customFonts,
  onSetAnnotationFontSize,
  onSetAnnotationDisplayText,
}: CommentEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const lastExternalCommentRef = useRef<string | undefined>(annotation.comment);
  const lastFlushedCommentRef = useRef<string | undefined>(annotation.comment);
  const onUpdateRef = useRef(onUpdate);

  onUpdateRef.current = onUpdate;

  // 词条展示文本（可编辑为原形）。未聚焦时跟随外部数据，聚焦时以本地草稿为准。
  const [wordDraft, setWordDraft] = useState(annotation.displayText || annotation.text);
  const wordFocusedRef = useRef(false);
  const skipWordCommitRef = useRef(false);

  useEffect(() => {
    if (!wordFocusedRef.current) {
      setWordDraft(annotation.displayText || annotation.text);
    }
  }, [annotation.displayText, annotation.text]);

  const commitWordDraft = useCallback(() => {
    if (skipWordCommitRef.current) {
      skipWordCommitRef.current = false;
      return;
    }
    const trimmed = wordDraft.trim();
    // 与原文一致（或为空）时不存 displayText，统一回退到原文
    const nextDisplay = trimmed && trimmed !== annotation.text ? trimmed : '';
    if ((annotation.displayText || '') !== nextDisplay) {
      onSetAnnotationDisplayText(annotation.id, nextDisplay);
    }
    setWordDraft(nextDisplay || annotation.text);
  }, [annotation.id, annotation.text, annotation.displayText, onSetAnnotationDisplayText, wordDraft]);

  const handleWordKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      // Esc 放弃本次修改并失焦，不写回数据
      skipWordCommitRef.current = true;
      setWordDraft(annotation.displayText || annotation.text);
      e.currentTarget.blur();
    }
  }, [annotation.displayText, annotation.text]);

  const resetWordDraft = useCallback(() => {
    setWordDraft(annotation.text);
    onSetAnnotationDisplayText(annotation.id, '');
  }, [annotation.id, annotation.text, onSetAnnotationDisplayText]);

  // Initialize content on mount only.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeComment(annotation.comment || '');
    }
  }, []);

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (editorRef.current) {
        const currentHtml = sanitizeComment(editorRef.current.innerHTML);
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
      editorRef.current.innerHTML = sanitizeComment(annotation.comment || '');
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
      const html = sanitizeComment(editorRef.current.innerHTML);
      lastFlushedCommentRef.current = html;
      onUpdate(annotation.id, html);
    }
  }, [annotation.id, onUpdate]);

  const handleInput = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        const html = sanitizeComment(editorRef.current.innerHTML);
        lastFlushedCommentRef.current = html;
        onUpdate(annotation.id, html);
      }
    }, 200);
  }, [annotation.id, onUpdate]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    flushNow();
  }, [flushNow]);

  // 粘贴时对富文本做白名单消毒，阻断 <img onerror> / <svg onload> 等活 XSS 进入 contentEditable
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    const clean = sanitizeComment(html || text);
    if (!editorRef.current || !clean) return;
    document.execCommand('insertHTML', false, clean);
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
      <div className="bg-slate-50 text-xs font-bold text-[#264376] p-2 border-b flex flex-wrap justify-between items-center gap-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {!hideSeq && <span className="shrink-0">[{annotation.seq}]</span>}
          <input
            type="text"
            value={wordDraft}
            onChange={(e) => setWordDraft(e.target.value)}
            onFocus={() => { wordFocusedRef.current = true; }}
            onBlur={() => { wordFocusedRef.current = false; commitWordDraft(); }}
            onKeyDown={handleWordKeyDown}
            placeholder={annotation.text}
            aria-label={`Word mark for ${annotation.text}`}
            title="可直接改成原形/词典形（如把 is/are 改为 be），正文标记保留原文"
            className="min-w-[96px] flex-1 bg-transparent border-b border-dashed border-slate-300 text-xs font-bold text-[#264376] py-0.5 focus:outline-none focus:border-[#264376] placeholder:text-slate-400"
          />
          {annotation.displayText && (
            <button
              type="button"
              onClick={resetWordDraft}
              className="p-1 rounded text-slate-400 hover:text-[#264376] hover:bg-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
              title="恢复原文"
              aria-label="Restore original text"
            >
              <RotateCcw size={12} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
          <select
            value={annotation.fontSize || ''}
            onChange={(e) => onSetAnnotationFontSize(annotation.id, e.target.value)}
            aria-label="Word mark font size"
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-amber-50 text-slate-700 focus:outline-none cursor-pointer"
            title="Word mark font size in comment column"
          >
            <option value="">Size</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
          </select>
          <select
            defaultValue=""
            aria-label="Comment text font size"
            onChange={(e) => { const v = e.target.value; if (v) applyStyle('fontSize', v); e.target.value = ''; }}
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer"
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
            aria-label="Comment text font family"
            onChange={(e) => { const v = e.target.value; if (v) applyStyle('fontFamily', v); e.target.value = ''; }}
            className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer max-w-[110px]"
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
            type="button"
            onClick={() => onRemove(annotation.id)}
            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Remove annotation"
            aria-label={`Remove annotation for ${annotation.text}`}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={`Comment text for ${annotation.text}`}
        className="p-2 prose prose-sm max-w-none focus:outline-none min-h-[60px]"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
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
    && prev.annotation.displayText === next.annotation.displayText
    && prev.hideSeq === next.hideSeq
    && prev.customFonts === next.customFonts
    && prev.onSetAnnotationFontSize === next.onSetAnnotationFontSize
    && prev.onSetAnnotationDisplayText === next.onSetAnnotationDisplayText
    && prev.onUpdate === next.onUpdate
    && prev.onRemove === next.onRemove;
});
