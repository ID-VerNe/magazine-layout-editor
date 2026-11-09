import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { MessageSquare, Link as LinkIcon, X } from 'lucide-react';
import { PageData, CustomFont, ExternalAnnotation } from '../../../types';
import { Label } from '../../ui/Base';

import { FontSize } from '../extensions/FontSize';
import { FontFamily } from '../extensions/FontFamily';
import { AnnotationMark } from '../extensions/AnnotationMark';
import { ClickWordSelection } from '../extensions/ClickWordSelection';
import { CommentEditor } from '../intensive/CommentEditor';
import { ArticleToolbar, CommentsToolbar } from '../intensive/IntensiveToolbar';
import {
  extractAnnotationsFromDoc,
  annotationHash,
  syncMarkSeq,
  getAnnotationThemeCSS,
} from '../intensive/annotationHelpers';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

// 正文初始占位文案。空文章如果默认进入 Annotate（只读）模式，用户看到
// “Start typing…” 却打不出字，因此这里统一常量并按内容决定初始模式。
const DEFAULT_LEFT_CONTENT = '<p>Start typing the main article text here...</p>';

const hasArticleText = (html?: string) =>
  !!html && html !== DEFAULT_LEFT_CONTENT && html.replace(/<[^>]*>/g, '').trim().length > 0;

export const IntensiveContentSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const [isAnnotateMode, setIsAnnotateMode] = useState(() => hasArticleText(page.leftContent));
  const pageRef = useRef(page);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const activePageIdRef = useRef(page.id);
  const leftContentRef = useRef(page.leftContent || '');
  const lastAnnotationHashRef = useRef('');
  
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const commentDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const periodicSyncRef = useRef<ReturnType<typeof setInterval>>(null);

  // Map of pageId -> Record<annotationId, commentHtml>
  const localCommentsByPageRef = useRef<Record<string, Record<string, string>>>({});
  const [renderTick, setRenderTick] = useState(0);

  // 删除后的撤销窗口：暂存被删批注，8 秒内可按原位置重新落标
  const [undoTarget, setUndoTarget] = useState<ExternalAnnotation | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  // Update pageRef and handle pageId changes
  useEffect(() => {
    // If switching to a different page, flush previous page's pending comments first
    if (activePageIdRef.current !== page.id) {
      const prevPageId = activePageIdRef.current;
      const prevPending = localCommentsByPageRef.current[prevPageId];
      if (prevPending && Object.keys(prevPending).length > 0 && pageRef.current.id === prevPageId) {
        const baseAnns = pageRef.current.annotations || [];
        const merged = baseAnns.map(ann => ({
          ...ann,
          comment: ann.id in prevPending ? prevPending[ann.id] : ann.comment,
        }));
        onUpdateRef.current({ ...pageRef.current, annotations: merged });
        delete localCommentsByPageRef.current[prevPageId];
      }
      // 切页后旧的撤销目标已失效，避免在别的页面上弹出无效撤销条
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      setUndoTarget(null);
      activePageIdRef.current = page.id;
      lastAnnotationHashRef.current = '';
    }
    pageRef.current = page;
  }, [page]);

  const activeAnnotations = useMemo((): ExternalAnnotation[] => {
    const base = page.annotations ?? [];
    const pagePending = localCommentsByPageRef.current[page.id];
    if (!pagePending || Object.keys(pagePending).length === 0) return base;
    return base.map(ann => ({
      ...ann,
      comment: ann.id in pagePending ? pagePending[ann.id] : ann.comment,
    }));
  }, [page.id, page.annotations, renderTick]);

  const syncLeftContent = useCallback((editor: Editor) => {
    const html = editor.getHTML();
    if (html !== leftContentRef.current && activePageIdRef.current === pageRef.current.id) {
      leftContentRef.current = html;
      onUpdateRef.current({ ...pageRef.current, leftContent: html });
    }
  }, []);

  const flushAll = useCallback((editor: Editor) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    if (commentDebounceRef.current) {
      clearTimeout(commentDebounceRef.current);
      commentDebounceRef.current = null;
    }

    const html = editor.getHTML();
    const htmlChanged = html !== leftContentRef.current;
    leftContentRef.current = html;

    const currentPageId = pageRef.current.id;
    const annotations = extractAnnotationsFromDoc(
      editor.state.doc,
      pageRef.current.annotations || [],
    );

    const pendingComments = localCommentsByPageRef.current[currentPageId];
    let commentsConsumed = false;
    if (pendingComments && Object.keys(pendingComments).length > 0) {
      annotations.forEach(ann => {
        if (ann.id in pendingComments) {
          ann.comment = pendingComments[ann.id];
          commentsConsumed = true;
        }
      });
      delete localCommentsByPageRef.current[currentPageId];
    }

    const newHash = annotationHash(annotations);
    const annotationsChanged = newHash !== lastAnnotationHashRef.current;
    lastAnnotationHashRef.current = newHash;

    if (annotationsChanged || commentsConsumed || htmlChanged) {
      onUpdateRef.current({ ...pageRef.current, leftContent: html, annotations });
    }
    if (annotationsChanged) {
      syncMarkSeq(editor, annotations);
    }
  }, []);

  const flushAllRef = useRef(flushAll);
  flushAllRef.current = flushAll;

  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    FontSize,
    FontFamily,
    AnnotationMark,
    ClickWordSelection,
  ], []);

  const leftEditor = useEditor({
    extensions,
    editable: !isAnnotateMode,
    content: page.leftContent || DEFAULT_LEFT_CONTENT,
    onUpdate: ({ editor, transaction }) => {
      if (transaction?.getMeta('annotationUpdate')) return;
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => flushAllRef.current(editor), 250);
    },
  });

  // 始终持有最新 editor 引用，供卸载清理使用（useEffect [] 只捕获首次渲染值）
  const leftEditorRef = useRef<ReturnType<typeof useEditor>>(null);
  leftEditorRef.current = leftEditor;

  // 点击批注序号时滚回正文对应标记并短暂高亮，长文里不用再自己找 [3] 在哪
  const handleFocusAnnotation = useCallback((id: string) => {
    const editor = leftEditorRef.current;
    if (!editor) return;
    const dom = editor.view.dom.querySelector<HTMLElement>(
      `mark[data-annotation-id="${id.replace(/["\\]/g, '\\$&')}"]`,
    );
    if (!dom) return;
    dom.scrollIntoView({ block: 'center', behavior: 'smooth' });
    dom.classList.remove('annotation-flash');
    // 读一次布局属性强制重排，保证连续点击同一标记时动画能重播
    void dom.offsetWidth;
    dom.classList.add('annotation-flash');
    window.setTimeout(() => dom.classList.remove('annotation-flash'), 1200);
  }, []);

  // Only reset content when switching pages or when editor is NOT actively focused
  useEffect(() => {
    if (!leftEditor) return;
    const content = page.leftContent || DEFAULT_LEFT_CONTENT;
    if (activePageIdRef.current !== page.id || (!leftEditor.isFocused && leftEditor.getHTML() !== content)) {
      leftEditor.commands.setContent(content);
      leftContentRef.current = content;
    }
  }, [page.id, page.leftContent, leftEditor]);

  // Periodic sync for left content while editing
  useEffect(() => {
    if (isAnnotateMode || !leftEditor) return;
    periodicSyncRef.current = setInterval(() => {
      syncLeftContent(leftEditor);
    }, 5000);
    return () => {
      if (periodicSyncRef.current) clearInterval(periodicSyncRef.current);
    };
  }, [isAnnotateMode, leftEditor, syncLeftContent]);

  useEffect(() => {
    if (!leftEditor) return;
    const onBlur = () => syncLeftContent(leftEditor);
    leftEditor.on('blur', onBlur);
    return () => { leftEditor.off('blur', onBlur); };
  }, [leftEditor, syncLeftContent]);

  const handleAddAnchor = useCallback(() => {
    if (!leftEditor) return;
    const id = `anchor-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    const currentCount = (pageRef.current.annotations || []).length;
    leftEditor.chain().focus().setAnnotation(id, currentCount + 1).run();
  }, [leftEditor]);

  const handleSetAnnotationFontSize = useCallback((id: string, size: string) => {
    const base = pageRef.current;
    const annotations = (base.annotations || []).map(a => a.id === id ? { ...a, fontSize: size } : a);
    onUpdateRef.current({ ...base, annotations });
  }, []);

  // 单独维护词条展示文本：正文标记仍保留原文，仅批注列显示用户填写的原形
  const handleSetAnnotationDisplayText = useCallback((id: string, text: string) => {
    const base = pageRef.current;
    const trimmed = text.trim();
    const annotations = (base.annotations || []).map(a =>
      a.id === id ? { ...a, displayText: trimmed || undefined } : a
    );
    const next = { ...base, annotations };
    // 立即同步 ref，避免 250ms 正文防抖 flush 用旧快照覆盖掉这次修改
    pageRef.current = next;
    onUpdateRef.current(next);
  }, []);

  useEffect(() => {
    if (leftEditor) {
      leftEditor.setEditable(!isAnnotateMode);
    }
  }, [isAnnotateMode, leftEditor]);

  // Update comment via single authoritative pipeline
  const updateComment = useCallback((id: string, html: string) => {
    const currentPageId = activePageIdRef.current;
    if (!localCommentsByPageRef.current[currentPageId]) {
      localCommentsByPageRef.current[currentPageId] = {};
    }
    localCommentsByPageRef.current[currentPageId][id] = html;
    setRenderTick(t => t + 1);

    if (commentDebounceRef.current) clearTimeout(commentDebounceRef.current);
    commentDebounceRef.current = setTimeout(() => {
      if (leftEditor) {
        flushAllRef.current(leftEditor);
      } else {
        const pending = localCommentsByPageRef.current[currentPageId];
        if (pending && Object.keys(pending).length > 0) {
          const baseAnns = pageRef.current.annotations || [];
          const merged = baseAnns.map(ann => ({
            ...ann,
            comment: ann.id in pending ? pending[ann.id] : ann.comment,
          }));
          onUpdateRef.current({ ...pageRef.current, annotations: merged });
          delete localCommentsByPageRef.current[currentPageId];
        }
      }
    }, 200);
  }, [leftEditor]);

  // Unmount cleanup: flush everything immediately
  useEffect(() => {
    return () => {
      const currentPageId = activePageIdRef.current;
      const editor = leftEditorRef.current;
      // 先冲刷主文章 leftContent 的 pending（250ms 防抖内未落盘的正文），防止切页/卸载丢字
      if (editor && currentPageId && activePageIdRef.current === pageRef.current.id) {
        try {
          const latest = editor.getHTML();
          if (latest && latest !== leftContentRef.current) {
            leftContentRef.current = latest;
            onUpdateRef.current({ ...pageRef.current, leftContent: latest });
          }
        } catch {
          // 编辑器已在卸载阶段销毁时跳过
        }
      }
      const pending = localCommentsByPageRef.current[currentPageId];
      if (pending && Object.keys(pending).length > 0) {
        const baseAnns = pageRef.current.annotations || [];
        const merged = baseAnns.map(ann => ({
          ...ann,
          comment: ann.id in pending ? pending[ann.id] : ann.comment,
        }));
        onUpdateRef.current({ ...pageRef.current, annotations: merged });
        delete localCommentsByPageRef.current[currentPageId];
      }
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (commentDebounceRef.current) clearTimeout(commentDebounceRef.current);
      if (periodicSyncRef.current) clearInterval(periodicSyncRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // 点击批注列卡片 → 高亮正文对应标记（与序号跳转互为反向）
  const handleFocusCommentCard = useCallback((id: string) => {
    const container = commentsScrollRef.current;
    if (!container) return;
    const card = container.querySelector<HTMLElement>(
      `[data-annotation-card="${id.replace(/["\\]/g, '\\$&')}"]`,
    );
    if (!card) return;
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    card.classList.remove('annotation-card-flash');
    void card.offsetWidth;
    card.classList.add('annotation-card-flash');
    window.setTimeout(() => card.classList.remove('annotation-card-flash'), 1200);
  }, []);

  // 正文（只读模式）点击已有标记时，ClickWordSelection 会派发该事件
  useEffect(() => {
    const dom = leftEditor?.view?.dom;
    if (!dom) return;
    const onFocus = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id) handleFocusCommentCard(id);
    };
    dom.addEventListener('annotation:focus', onFocus);
    return () => dom.removeEventListener('annotation:focus', onFocus);
  }, [leftEditor, handleFocusCommentCard]);

  const handleRemoveAnnotation = useCallback((id: string) => {
    if (!leftEditor) return;
    const currentPageId = activePageIdRef.current;
    // 先留存被删批注（含尚未落盘的评论），供 8 秒内撤销
    const removed = (pageRef.current.annotations || []).find(a => a.id === id);
    const pendingComment = localCommentsByPageRef.current[currentPageId]?.[id];

    leftEditor.chain().unsetAnnotation(id).run();
    if (localCommentsByPageRef.current[currentPageId]) {
      delete localCommentsByPageRef.current[currentPageId][id];
    }
    flushAll(leftEditor);

    if (!removed) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoTarget(pendingComment === undefined ? removed : { ...removed, comment: pendingComment });
    undoTimerRef.current = setTimeout(() => setUndoTarget(null), 8000);
  }, [leftEditor, flushAll]);

  const handleUndoRemove = useCallback(() => {
    const target = undoTarget;
    if (!leftEditor || !target) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoTarget(null);

    const { doc } = leftEditor.state;
    const from = Math.min(target.from, doc.content.size);
    const to = Math.min(target.to, doc.content.size);
    // 期间正文可能已改动：文本对不上就放弃，避免把标记落到错误位置
    if (from >= to || doc.textBetween(from, to, ' ', ' ') !== target.text) return;

    leftEditor.chain()
      .setTextSelection({ from, to })
      .setAnnotation(target.id, target.seq)
      .run();

    // 先把批注元信息（评论 / 展示文本 / 字号）放回快照，flushAll 重新提取时会沿用
    const base = pageRef.current;
    const existing = base.annotations || [];
    if (!existing.some(a => a.id === target.id)) {
      const annotations = [...existing, target].sort((a, b) => a.from - b.from);
      pageRef.current = { ...base, annotations };
    }
    flushAll(leftEditor);
  }, [leftEditor, undoTarget, flushAll]);

  const handleChange = <K extends keyof PageData>(field: K, value: PageData[K]) => {
    onUpdateRef.current({ ...pageRef.current, [field]: value });
  };

  const handleToggleTheme = useCallback(() => {
    const themes: Array<'highlight' | 'underline' | 'both'> = ['highlight', 'underline', 'both'];
    const current = page.annotationTheme || 'highlight';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    handleChange('annotationTheme', next);
  }, [page.annotationTheme]);

  const handleToggleStyle = useCallback(() => {
    handleChange('annotationStyle', page.annotationStyle === 'single' ? 'dual' : 'single');
  }, [page.annotationStyle]);

  const handleToggleSeq = useCallback(() => {
    handleChange('hideAnnotationSeq', !page.hideAnnotationSeq);
  }, [page.hideAnnotationSeq]);

  if (!leftEditor) return null;

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <Label icon={MessageSquare} className="mb-0">Article &amp; Comments</Label>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Article (Top) */}
        <div className="space-y-2 flex flex-col min-w-0">
          <ArticleToolbar
            editor={leftEditor}
            isAnnotateMode={isAnnotateMode}
            onSetAnnotateMode={setIsAnnotateMode}
            onAddAnchor={handleAddAnchor}
            onToggleTheme={handleToggleTheme}
            onToggleSeq={handleToggleSeq}
            annotationTheme={page.annotationTheme}
            hideAnnotationSeq={page.hideAnnotationSeq}
            customFonts={customFonts}
          />

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#264376] flex flex-col min-h-[300px] relative">
            <div className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 p-2 border-b flex justify-between items-center gap-2">
              <span className="shrink-0">Main Article</span>
              <span className="normal-case font-medium text-slate-400 truncate">
                {isAnnotateMode
                  ? 'Read-only · marks in original text · click a word to select'
                  : 'Editing · marks in original text'}
              </span>
            </div>

            <BubbleMenu
              editor={leftEditor}
              options={{ placement: 'top', offset: 5 }}
              className="flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1.5 z-50"
              shouldShow={({ editor, state }) => {
                const { from, to } = state.selection;
                if (editor.isActive('annotationMark')) return false;
                if (editor.isEditable) return false;
                if (from !== to) return true;
                if (from < 0 || from >= state.doc.content.size) return false;
                const $pos = state.doc.resolve(from);
                return $pos.parent.type.name === 'paragraph' && $pos.parent.textContent.length > 0;
              }}
            >
              <button
                type="button"
                onClick={handleAddAnchor}
                aria-label="Add a comment for the selected text"
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#264376] hover:bg-slate-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
              >
                <LinkIcon size={14} aria-hidden="true" /> Add comment
              </button>
            </BubbleMenu>

            <EditorContent editor={leftEditor} className="p-4 prose max-w-none focus:outline-none flex-1 overflow-y-auto" />
          </div>
        </div>

        {/* Comments (Bottom) */}
        <div className="space-y-2 flex flex-col min-w-0">
          <CommentsToolbar
            annotationStyle={page.annotationStyle}
            onToggleStyle={handleToggleStyle}
          />
          <div className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#264376] flex flex-col min-h-[300px] ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`}>
            <div className="bg-white text-[10px] uppercase font-bold text-slate-500 p-2 border-b flex justify-between items-center gap-2 shadow-sm z-10">
              <span className="shrink-0">Comments</span>
              <span className="normal-case font-medium text-slate-400 truncate">
                One card per mark · click [n] or a mark to jump
              </span>
            </div>

            {undoTarget && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800"
              >
                <span className="flex-1 truncate">
                  Removed “{undoTarget.displayText || undoTarget.text}”
                </span>
                <button
                  type="button"
                  onClick={handleUndoRemove}
                  className="px-2 py-1 rounded font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={() => setUndoTarget(null)}
                  aria-label="Dismiss undo"
                  className="p-1 rounded hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            )}

            <div ref={commentsScrollRef} className="p-4 flex-1 overflow-y-auto">
              {activeAnnotations.length === 0 ? (
                <div className="text-sm text-slate-500 italic text-center mt-10 px-4">
                  {isAnnotateMode
                    ? 'Click a word in the article, then press “Add comment”.'
                    : 'Switch to Annotate mode to add notes.'}
                </div>
              ) : (
                activeAnnotations.map(ann => (
                  <CommentEditor
                    key={ann.id}
                    annotation={ann}
                    onUpdate={updateComment}
                    onRemove={handleRemoveAnnotation}
                    hideSeq={page.hideAnnotationSeq}
                    customFonts={customFonts}
                    onSetAnnotationFontSize={handleSetAnnotationFontSize}
                    onSetAnnotationDisplayText={handleSetAnnotationDisplayText}
                    onFocusAnnotation={handleFocusAnnotation}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ProseMirror mark[data-annotation-id] {
          ${getAnnotationThemeCSS(page.annotationTheme)}
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          color: inherit;
        }
        ${!page.hideAnnotationSeq ? `
        .ProseMirror mark[data-annotation-id]::after {
          content: "[" attr(data-seq) "]";
          vertical-align: super;
          font-size: 0.75em;
          color: inherit;
          margin-left: 2px;
          font-weight: bold;
        }
        ` : ''}
      `}</style>
    </section>
  );
};