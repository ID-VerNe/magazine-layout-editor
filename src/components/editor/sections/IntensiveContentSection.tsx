import React, { useCallback, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { MessageSquare, Link as LinkIcon, Unlink, Image as ImageIcon, Bold, Italic, AArrowDown, AArrowUp, Type, Paintbrush, AlignLeft, X } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label } from '../../ui/Base';

import { FontSize } from '../extensions/FontSize';
import { AnchorUnderline } from '../extensions/AnchorUnderline';
import { AnnotationMark } from '../extensions/AnnotationMark';
import { AnnotationBlock } from '../extensions/AnnotationBlock';
import { CardImage } from '../extensions/CardImage';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Editor } from '@tiptap/react';

interface ExternalAnnotation {
  id: string;
  seq: number;
  text: string;
  from: number;
  to: number;
  comment?: string;
}

const ClickWordSelection = Extension.create({
  name: 'clickWordSelection',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clickWordSelection'),
        props: {
          handleClick(view, pos, event) {
            const { state } = view;
            if (view.editable) return false; // Only active when editable is false (Annotate Mode)

            const $pos = state.doc.resolve(pos);
            if (!$pos.parent.isTextblock) return false;

            const text = $pos.parent.textContent;
            const parentOffset = $pos.parentOffset;

            // Simplified word boundary regex: space, punctuation, CJK chars
            const isBoundary = (char: string) => /[\s,.\-!?;:"'()[\]{}<>，。！？；：“”‘’（）【】《》]/.test(char);

            let start = parentOffset;
            while (start > 0 && !isBoundary(text[start - 1])) start--;
            
            let end = parentOffset;
            while (end < text.length && !isBoundary(text[end])) end++;

            const absStart = $pos.pos - parentOffset + start;
            const absEnd = $pos.pos - parentOffset + end;

            if (absStart < absEnd) {
              const tr = state.tr;
              tr.setSelection(TextSelection.create(state.doc, absStart, absEnd));
              view.dispatch(tr);
              return true;
            }
            return false;
          }
        }
      })
    ];
  }
});

const CommentEditor: React.FC<{ annotation: ExternalAnnotation, onUpdate: (id: string, html: string) => void, onRemove: (id: string) => void }> = ({ annotation, onUpdate, onRemove }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      CardImage,
    ],
    content: annotation.comment || '',
    onUpdate: ({ editor }) => {
      onUpdate(annotation.id, editor.getHTML());
    }
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mb-3 shadow-sm">
      <div className="bg-slate-50 text-xs font-bold text-[#367237] p-2 border-b flex justify-between items-center">
        <span>[{annotation.seq}] {annotation.text}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}><Bold size={12} /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}><Italic size={12} /></button>
          <div className="w-px h-3 bg-slate-300 mx-0.5" />
          <button onClick={() => onRemove(annotation.id)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"><X size={12} /></button>
        </div>
      </div>
      <EditorContent editor={editor} className="p-2 prose prose-sm max-w-none focus:outline-none min-h-[60px]" />
    </div>
  );
};

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const IntensiveContentSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const [isAnnotateMode, setIsAnnotateMode] = React.useState(true);
  const pageRef = React.useRef(page);
  React.useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Will inject leftEditor.setEditable in another block since leftEditor isn't defined here yet

  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...pageRef.current, [field]: value });
  };

  const leftEditor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      AnnotationMark,
      ClickWordSelection,
    ],
    editable: !isAnnotateMode,
    content: page.leftContent || '<p>Start typing the main article text here...</p>',
    onUpdate: ({ editor }) => {
      // 1. Get HTML for preview rendering
      const html = editor.getHTML();
      
      // 2. Extract annotations as single source of truth for the right editor
      const extracted: ExternalAnnotation[] = [];
      const map = new Map<string, ExternalAnnotation>();
      
      editor.state.doc.descendants((node, pos) => {
        const mark = node.marks.find(m => m.type.name === 'annotationMark');
        if (mark) {
          const id = mark.attrs.id;
          const seq = parseInt(mark.attrs.seq, 10);
          if (map.has(id)) {
             map.get(id)!.text += node.text || '';
             map.get(id)!.to = pos + node.nodeSize;
          } else {
             const oldAnn = (pageRef.current.annotations || []).find(a => a.id === id);
             const ann = { id, seq, text: node.text || '', from: pos, to: pos + node.nodeSize, comment: oldAnn?.comment };
             map.set(id, ann);
             extracted.push(ann);
          }
        }
      });
      
      // Re-sequence them to ensure they are strictly 1..N based on position
      extracted.sort((a, b) => a.from - b.from);
      let changedSeq = false;
      extracted.forEach((ann, i) => {
        const correctSeq = i + 1;
        if (ann.seq !== correctSeq) {
          ann.seq = correctSeq;
          changedSeq = true;
        }
      });
      
      // If sequence numbers changed, update the editor marks to match!
      if (changedSeq) {
        // Prevent recursive onUpdate loop
        queueMicrotask(() => {
          const tr = editor.state.tr;
          extracted.forEach(ann => {
            tr.addMark(ann.from, ann.to, editor.schema.marks.annotationMark.create({ id: ann.id, seq: ann.seq }));
          });
          editor.view.dispatch(tr);
        });
      } else {
        onUpdate({ ...pageRef.current, leftContent: html, annotations: extracted });
      }
    },
  });

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

  const updateComment = useCallback((id: string, html: string) => {
    const newAnnotations = (pageRef.current.annotations || []).map(ann => 
      ann.id === id ? { ...ann, comment: html } : ann
    );
    handleChange('annotations', newAnnotations);
  }, []);

  const handleRemoveAnnotation = useCallback((id: string) => {
    if (leftEditor) {
      leftEditor.chain().unsetAnnotation(id).run();
    }
  }, [leftEditor]);

  if (!leftEditor) return null;

  const ratio = page.splitRatio || 64;

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title, isAction = false }: any) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-all flex items-center justify-center ${
        isActive 
          ? 'bg-slate-800 text-white shadow-sm' 
          : isAction 
            ? 'text-blue-600 hover:bg-blue-50' 
            : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      <Icon size={16} />
    </button>
  );

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

  const handleToggleTheme = () => {
    const themes: Array<'highlight' | 'underline' | 'both'> = ['highlight', 'underline', 'both'];
    const current = page.annotationTheme || 'highlight';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    handleChange('annotationTheme', next);
  };

  const handleToggleStyle = () => {
    handleChange('annotationStyle', page.annotationStyle === 'single' ? 'dual' : 'single');
  };

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
            
            <ToolbarButton onClick={() => leftEditor.chain().focus().toggleBold().run()} isActive={leftEditor.isActive('bold')} icon={Bold} title="Bold" />
            <ToolbarButton onClick={() => leftEditor.chain().focus().toggleItalic().run()} isActive={leftEditor.isActive('italic')} icon={Italic} title="Italic" />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={() => leftEditor.chain().focus().setFontSize('12px').run()} icon={AArrowDown} title="Small Text" />
            <ToolbarButton onClick={() => leftEditor.chain().focus().unsetFontSize().run()} icon={Type} title="Normal Text" />
            <ToolbarButton onClick={() => leftEditor.chain().focus().setFontSize('24px').run()} icon={AArrowUp} title="Large Text" />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={handleAddAnchor} icon={LinkIcon} title="Link to Comment (Creates Note on Right)" isAction={true} />
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <ToolbarButton onClick={handleToggleTheme} icon={Paintbrush} title={`Theme: ${page.annotationTheme || 'highlight'}`} />
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
                   if (editor.isActive('annotationMark')) return false; // Hide if already annotated
                   if (from !== to) return true; // Show on normal selection
                   
                   // Show if cursor is inside a paragraph with text
                   const $pos = state.doc.resolve(from);
                   if ($pos.parent.type.name === 'paragraph' && $pos.parent.textContent.length > 0) {
                     return true;
                   }
                   return false;
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
               {(page.annotations || []).length === 0 ? (
                 <div className="text-sm text-slate-400 italic text-center mt-10">Select a word in the main article to add a comment...</div>
               ) : (
                 (page.annotations || []).map(ann => (
                   <CommentEditor key={ann.id} annotation={ann} onUpdate={updateComment} onRemove={handleRemoveAnnotation} />
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .ProseMirror { outline: none; min-height: 100%; }
        .ProseMirror p { margin-top: 0.5em; margin-bottom: 0.5em; }
        .ProseMirror mark[data-annotation-id] { 
          ${getThemeCSS(page.annotationTheme)}
          cursor: pointer; 
          transition: all 0.2s; 
          position: relative;
          color: inherit;
        }
        .ProseMirror mark[data-annotation-id]:hover { opacity: 0.8; }
        .ProseMirror mark[data-annotation-id]::after {
          content: "[" attr(data-seq) "]";
          vertical-align: super;
          font-size: 0.75em;
          color: inherit;
          margin-left: 2px;
          font-weight: bold;
        }

      `}</style>
    </section>
  );
};
