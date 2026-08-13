import React, { useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { MessageSquare, Link as LinkIcon, Quote, Paintbrush, AlignLeft, Hash, X, Bold, Italic } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label } from '../../ui/Base';

import { FontSize } from '../extensions/FontSize';
import { AnnotationMark } from '../extensions/AnnotationMark';
import DOMPurify from 'dompurify';

interface ExternalAnnotation {
  id: string;
  seq: number;
  text: string;
  from: number;
  to: number;
  comment?: string;
}

// Fast word boundary detection using Set (O(1) lookup vs O(n) regex)
const BOUNDARY_CHARS = new Set([
  ' ', '\t', '\n', ',', '.', '-', '!', '?', ';', ':', '"', "'",
  '(', ')', '[', ']', '{', '}', '<', '>',
  '，', '。', '！', '？', '；', '：', '“', '”', '‘', '’', '（', '）', '【', '】', '《', '》',
  '…', '—', '～', '·',
]);

// Extract annotations from ProseMirror document, preserving existing comments.
// Re-sequences by position (1..N) in-place.
function extractAnnotationsFromDoc(doc: any, existingAnnotations: ExternalAnnotation[]): ExternalAnnotation[] {
  const map = new Map<string, ExternalAnnotation>();
  const extracted: ExternalAnnotation[] = [];

  doc.descendants((node: any, pos: number) => {
    const mark = node.marks.find((m: any) => m.type.name === 'annotationMark');
    if (mark) {
      const id = mark.attrs.id;
      if (map.has(id)) {
        map.get(id)!.text += node.text || '';
        map.get(id)!.to = pos + node.nodeSize;
      } else {
        const oldAnn = existingAnnotations.find(a => a.id === id);
        extracted.push({
          id, seq: parseInt(mark.attrs.seq, 10),
          text: node.text || '',
          from: pos, to: pos + node.nodeSize,
          comment: oldAnn?.comment,
        });
        map.set(id, extracted[extracted.length - 1]);
      }
    }
  });

  extracted.sort((a, b) => a.from - b.from);
  extracted.forEach((ann, i) => { ann.seq = i + 1; });

  return extracted;
}

// Lightweight snapshot for change detection.
function annotationHash(annotations: ExternalAnnotation[]): string {
  if (annotations.length === 0) return '';
  return annotations.map(a => `${a.id}:${a.seq}:${a.text}`).join('|');
}

// Fix mark seq numbers in the editor by walking the CURRENT doc (positions are always
// valid — never use stale from/to captured earlier). Guarded by transaction meta so
// onUpdate doesn't re-enter.
function syncMarkSeq(editor: Editor, annotations: ExternalAnnotation[]) {
  const seqMap = new Map(annotations.map(a => [a.id, a.seq]));
  const tr = editor.state.tr;
  let changed = false;
  editor.state.doc.descendants((node, pos) => {
    const mark = node.marks.find(m => m.type.name === 'annotationMark');
    if (mark && seqMap.has(mark.attrs.id)) {
      const newSeq = seqMap.get(mark.attrs.id);
      if (String(mark.attrs.seq) !== String(newSeq)) {
        const newMark = editor.schema.marks.annotationMark.create({ ...mark.attrs, seq: newSeq });
        tr.addMark(pos, pos + node.nodeSize, newMark);
        changed = true;
      }
    }
  });
  if (changed) {
    tr.setMeta('annotationUpdate', true);
    editor.view.dispatch(tr);
  }
}

// ─── ToolbarButton ───────────────────────────────────────────────

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
  isAction?: boolean;
  disabled?: boolean;
}> = memo(({ onClick, isActive, icon: Icon, title, isAction, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded transition-colors ${
      disabled
        ? 'opacity-40 cursor-not-allowed text-slate-400'
        : isActive
          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
          : isAction
            ? 'text-slate-700 bg-white shadow-sm border border-slate-200 hover:bg-slate-50'
            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
    }`}
  >
    <Icon size={14} />
  </button>
));

// ─── ClickWordSelection ──────────────────────────────────────────

const ClickWordSelection = Extension.create({
  name: 'clickWordSelection',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clickWordSelection'),
        props: {
          handleClick(view, pos) {
            const { state } = view;
            if (view.editable) return false;

            const $pos = state.doc.resolve(pos);
            if (!$pos.parent.isTextblock) return false;

            const text = $pos.parent.textContent;
            const parentOffset = $pos.parentOffset;

            let start = parentOffset;
            while (start > 0 && !BOUNDARY_CHARS.has(text[start - 1])) start--;

            let end = parentOffset;
            while (end < text.length && !BOUNDARY_CHARS.has(text[end])) end++;

            const absStart = $pos.pos - parentOffset + start;
            const absEnd = $pos.pos - parentOffset + end;

            if (absStart < absEnd) {
              const tr = state.tr;
              tr.setSelection(TextSelection.create(state.doc, absStart, absEnd));
              view.dispatch(tr);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

// ─── CommentEditor (lightweight contentEditable) ─────────────────

const CommentEditor = memo(({
  annotation,
  onUpdate,
  onRemove,
  hideSeq,
}: {
  annotation: ExternalAnnotation;
  onUpdate: (id: string, html: string) => void;
  onRemove: (id: string) => void;
  hideSeq?: boolean;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isFocusedRef = useRef(false);
  const lastExternalCommentRef = useRef<string | undefined>(annotation.comment);

  // Initialize content on mount only.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(annotation.comment || '');
    }
  }, []);

  // Sync external comment changes only when the user isn't actively editing.
  useEffect(() => {
    if (!editorRef.current) return;
    if (isFocusedRef.current) return;
    if (annotation.comment !== lastExternalCommentRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(annotation.comment || '');
      lastExternalCommentRef.current = annotation.comment;
    }
  }, [annotation.comment]);

  const handleInput = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (editorRef.current) {
        onUpdate(annotation.id, editorRef.current.innerHTML);
      }
    }, 800);
  }, [annotation.id, onUpdate]);

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

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3 shadow-sm">
      <div className="bg-slate-50 text-xs font-bold text-[#367237] p-2 border-b flex justify-between items-center">
        <span>{!hideSeq && `[${annotation.seq}] `}{annotation.text}</span>
        <div className="flex items-center gap-1">
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
        onBlur={() => { isFocusedRef.current = false; }}
      />
    </div>
  );
}, (prev, next) => {
  return prev.annotation.id === next.annotation.id
    && prev.annotation.seq === next.annotation.seq
    && prev.annotation.comment === next.annotation.comment
    && prev.annotation.text === next.annotation.text
    && prev.hideSeq === next.hideSeq
    && prev.onUpdate === next.onUpdate
    && prev.onRemove === next.onRemove;
});

// ─── Main Section ────────────────────────────────────────────────

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const IntensiveContentSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const [isAnnotateMode, setIsAnnotateMode] = React.useState(true);
  const pageRef = useRef(page);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastAnnotationHashRef = useRef('');
  const leftContentRef = useRef(page.leftContent || '');
  const periodicSyncRef = useRef<ReturnType<typeof setInterval>>(null);

  // ── Local annotations state (decoupled from global state) ──────

  // localCommentsRef stores comments that have been edited but NOT yet synced to global state.
  // This is the KEY optimization: typing in a CommentEditor only updates this ref + triggers
  // a local re-render, skipping the entire setPages → EditorPanel → Editor cascade.
  const localCommentsRef = useRef<Record<string, string | undefined>>({});
  const [renderTick, setRenderTick] = React.useState(0);
  // Trailing debounce: flush local comments to global state 1500ms after the last keystroke,
  // so edits persist (autosave) without janking the interaction.
  const localFlushTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Merge local comments into page annotations for rendering.
  // Stale comments in localCommentsRef are merged on top of page.annotations.
  const activeAnnotations = useMemo((): ExternalAnnotation[] => {
    const base = page.annotations ?? [];
    const localKeys = Object.keys(localCommentsRef.current);
    if (localKeys.length === 0) return base;
    return base.map(ann => ({
      ...ann,
      comment: ann.id in localCommentsRef.current
        ? localCommentsRef.current[ann.id]
        : ann.comment,
    }));
  }, [page.annotations, renderTick]);

  // Sync local comments to global state (called when leaving the page etc.)
  const syncLocalComments = useCallback(() => {
    const keys = Object.keys(localCommentsRef.current);
    if (keys.length === 0) return;
    const base = pageRef.current.annotations ?? [];
    let changed = false;
    const merged = base.map(ann => {
      if (ann.id in localCommentsRef.current && localCommentsRef.current[ann.id] !== ann.comment) {
        changed = true;
        return { ...ann, comment: localCommentsRef.current[ann.id] };
      }
      return ann;
    });
    if (changed) {
      onUpdate({ ...pageRef.current, annotations: merged });
    }
    localCommentsRef.current = {};
  }, [onUpdate]);

  // ── Effects ────────────────────────────────────────────────────

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Sync leftContent to global state for preview.
  const syncLeftContent = useCallback((editor: Editor) => {
    const html = editor.getHTML();
    if (html !== leftContentRef.current) {
      leftContentRef.current = html;
      onUpdate({ ...pageRef.current, leftContent: html });
    }
  }, [onUpdate]);

  // Extract annotations + sync to global state when they actually change.
  // Merges local comments before persisting.
  const flushAnnotations = useCallback((editor: Editor) => {
    const html = editor.getHTML();
    const htmlChanged = html !== leftContentRef.current;
    leftContentRef.current = html;
    
    const annotations = extractAnnotationsFromDoc(
      editor.state.doc,
      pageRef.current.annotations || [],
    );

    // Merge local comments into extracted annotations before persisting.
    // Track whether any were consumed so we never drop them on the floor.
    const localKeys = Object.keys(localCommentsRef.current);
    let consumedLocal = false;
    if (localKeys.length > 0) {
      annotations.forEach(ann => {
        if (ann.id in localCommentsRef.current) {
          ann.comment = localCommentsRef.current[ann.id];
          consumedLocal = true;
        }
      });
      localCommentsRef.current = {};
    }

    const newHash = annotationHash(annotations);
    const annotationsChanged = newHash !== lastAnnotationHashRef.current;
    lastAnnotationHashRef.current = newHash;

    if (annotationsChanged || consumedLocal || htmlChanged) {
      onUpdate({ ...pageRef.current, leftContent: html, annotations });
    }
    if (annotationsChanged) {
      // Walk the CURRENT doc to fix seq numbers — never stale positions.
      syncMarkSeq(editor, annotations);
    }
  }, [onUpdate]);

  const flushAnnotationsRef = useRef(flushAnnotations);
  flushAnnotationsRef.current = flushAnnotations;

  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    FontSize,
    AnnotationMark,
    ClickWordSelection,
  ], []);

  const leftEditor = useEditor({
    extensions,
    editable: !isAnnotateMode,
    content: page.leftContent || '<p>Start typing the main article text here...</p>',
    onUpdate: ({ editor, transaction }) => {
      if (transaction?.getMeta('annotationUpdate')) return;

      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => flushAnnotationsRef.current(editor), 300);
    },
  });

  // Reset editor content when switching to a different page.
  useEffect(() => {
    if (!leftEditor) return;
    const content = page.leftContent || '<p>Start typing the main article text here...</p>';
    if (leftEditor.getHTML() !== content) {
      leftEditor.commands.setContent(content);
    }
    leftContentRef.current = content;
    lastAnnotationHashRef.current = '';
    localCommentsRef.current = {};
    setRenderTick(t => t + 1);
  }, [page.id, page.leftContent, leftEditor]);

  // Periodic sync: flush leftContent to global state every 5s during active editing.
  useEffect(() => {
    if (isAnnotateMode || !leftEditor) return;
    periodicSyncRef.current = setInterval(() => {
      syncLeftContent(leftEditor);
    }, 5000);
    return () => {
      if (periodicSyncRef.current) clearInterval(periodicSyncRef.current);
    };
  }, [isAnnotateMode, leftEditor, syncLeftContent]);

  // Blur handler: sync leftContent when the ProseMirror view loses focus.
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

  useEffect(() => {
    if (leftEditor) {
      leftEditor.setEditable(!isAnnotateMode);
    }
  }, [isAnnotateMode, leftEditor]);

  // Called from CommentEditor — writes to local state only, no global cascade.
  // Trailing debounce: flush to global state 1500ms after last keystroke for autosave.
  const updateComment = useCallback((id: string, html: string) => {
    localCommentsRef.current[id] = html;
    setRenderTick(t => t + 1);

    if (localFlushTimeoutRef.current) clearTimeout(localFlushTimeoutRef.current);
    localFlushTimeoutRef.current = setTimeout(() => {
      syncLocalComments();
    }, 1500);
  }, [syncLocalComments]);

  // Flush local comments on unmount (so autosave captures last edits) and
  // clear pending timers so they can't fire against a destroyed editor.
  useEffect(() => {
    return () => {
      syncLocalComments();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (localFlushTimeoutRef.current) clearTimeout(localFlushTimeoutRef.current);
    };
  }, [syncLocalComments]);

  const handleRemoveAnnotation = useCallback((id: string) => {
    if (!leftEditor) return;
    leftEditor.chain().unsetAnnotation(id).run();
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (localFlushTimeoutRef.current) clearTimeout(localFlushTimeoutRef.current);
    delete localCommentsRef.current[id];
    flushAnnotations(leftEditor);
  }, [leftEditor, flushAnnotations]);

  if (!leftEditor) return null;

  const ratio = page.splitRatio || 64;

  const getThemeCSS = (theme: string = 'highlight') => {
    switch (theme) {
      case 'underline':
        return `
          text-decoration: underline;
          text-decoration-color: #3b82f6;
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
          background-color: transparent;
        `;
      case 'both':
        return `
          text-decoration: underline;
          text-decoration-color: #3b82f6;
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
          background-color: #eff6ff;
        `;
      case 'highlight':
      default:
        return `
          text-decoration: none;
          background-color: #eff6ff;
        `;
    }
  };

  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...pageRef.current, [field]: value });
  };

  const handleToggleTheme = useCallback(() => {
    const themes: Array<'highlight' | 'underline' | 'both'> = ['highlight', 'underline', 'both'];
    const current = page.annotationTheme || 'highlight';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    handleChange('annotationTheme', next);
  }, [page.annotationTheme, handleChange]);

  const handleToggleStyle = useCallback(() => {
    handleChange('annotationStyle', page.annotationStyle === 'single' ? 'dual' : 'single');
  }, [page.annotationStyle, handleChange]);

  const handleToggleSeq = useCallback(() => {
    handleChange('hideAnnotationSeq', !page.hideAnnotationSeq);
  }, [page.hideAnnotationSeq, handleChange]);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <Label icon={MessageSquare} className="mb-0">Dual-Column Content</Label>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Article (Top) */}
        <div className="space-y-2 flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner">
            <div className="flex bg-slate-200 p-0.5 rounded mr-2">
              <button
                onClick={() => setIsAnnotateMode(false)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${!isAnnotateMode ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Edit Article
              </button>
              <button
                onClick={() => setIsAnnotateMode(true)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${isAnnotateMode ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Annotate
              </button>
            </div>

            <ToolbarButton
              onClick={() => leftEditor.chain().focus().toggleBlockquote().run()}
              isActive={leftEditor.isActive('blockquote')}
              icon={Quote}
              title={leftEditor.isActive('blockquote') ? 'Remove emphasis from this paragraph' : 'Emphasize this paragraph (blockquote style)'}
              isAction={leftEditor.isActive('blockquote')}
            />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton
              onClick={handleAddAnchor}
              icon={LinkIcon}
              title={isAnnotateMode ? 'Link to Comment (Creates Note on Right)' : 'Switch to Annotate mode to create a comment'}
              isAction={true}
              disabled={!isAnnotateMode}
            />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={handleToggleTheme} icon={Paintbrush} title={`Theme: ${page.annotationTheme || 'highlight'}`} />
            <ToolbarButton onClick={handleToggleSeq} isActive={!page.hideAnnotationSeq} icon={Hash} title={page.hideAnnotationSeq ? 'Show Numbers' : 'Hide Numbers'} />
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#264376] flex flex-col min-h-[300px] relative">
             <div className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 p-2 border-b flex justify-between items-center">
               <span>Main Article</span>
             </div>

             {leftEditor && (
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
                   return $pos.parent.type.name === 'paragraph'
                     && $pos.parent.textContent.length > 0;
                 }}
               >
                 <button
                   onClick={handleAddAnchor}
                   className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                 >
                   <LinkIcon size={14} /> Cite
                 </button>
               </BubbleMenu>
             )}

             <EditorContent editor={leftEditor} className="p-4 prose max-w-none focus:outline-none flex-1 overflow-y-auto" />
          </div>
        </div>

        {/* Comments (Bottom) */}
        <div className="space-y-2 flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner justify-end">
            <ToolbarButton onClick={handleToggleStyle} icon={AlignLeft} title={`Style: ${page.annotationStyle === 'single' ? 'Single Line' : 'Dual Line'}`} />
          </div>
          <div className={`border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#264376] flex flex-col min-h-[300px] ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`}>
             <div className="bg-white text-[10px] uppercase font-bold text-slate-400 p-2 border-b flex justify-between items-center shadow-sm z-10">
               <span>Comments</span>
             </div>
             <div className="p-4 flex-1 overflow-y-auto">
               {activeAnnotations.length === 0 ? (
                 <div className="text-sm text-slate-400 italic text-center mt-10">Select a word in the main article to add a comment...</div>
               ) : (
                 activeAnnotations.map(ann => (
                   <CommentEditor key={ann.id} annotation={ann} onUpdate={updateComment} onRemove={handleRemoveAnnotation} hideSeq={page.hideAnnotationSeq} />
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .ProseMirror mark[data-annotation-id] {
          ${getThemeCSS(page.annotationTheme)}
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