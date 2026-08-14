import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { MessageSquare, Link as LinkIcon } from 'lucide-react';
import { PageData, CustomFont, ExternalAnnotation } from '../../../types';
import { Label } from '../../ui/Base';

import { FontSize } from '../extensions/FontSize';
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

export const IntensiveContentSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const [isAnnotateMode, setIsAnnotateMode] = useState(true);
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
      updateTimeoutRef.current = setTimeout(() => flushAllRef.current(editor), 250);
    },
  });

  // Only reset content when switching pages or when editor is NOT actively focused
  useEffect(() => {
    if (!leftEditor) return;
    const content = page.leftContent || '<p>Start typing the main article text here...</p>';
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
    };
  }, []);

  const handleRemoveAnnotation = useCallback((id: string) => {
    if (!leftEditor) return;
    leftEditor.chain().unsetAnnotation(id).run();
    const currentPageId = activePageIdRef.current;
    if (localCommentsByPageRef.current[currentPageId]) {
      delete localCommentsByPageRef.current[currentPageId][id];
    }
    flushAll(leftEditor);
  }, [leftEditor, flushAll]);

  const handleChange = (field: keyof PageData, value: any) => {
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
        <Label icon={MessageSquare} className="mb-0">Dual-Column Content</Label>
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
            <div className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 p-2 border-b flex justify-between items-center">
              <span>Main Article</span>
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
                onClick={handleAddAnchor}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
              >
                <LinkIcon size={14} /> Cite
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
            <div className="bg-white text-[10px] uppercase font-bold text-slate-400 p-2 border-b flex justify-between items-center shadow-sm z-10">
              <span>Comments</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {activeAnnotations.length === 0 ? (
                <div className="text-sm text-slate-400 italic text-center mt-10">Select a word in the main article to add a comment...</div>
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