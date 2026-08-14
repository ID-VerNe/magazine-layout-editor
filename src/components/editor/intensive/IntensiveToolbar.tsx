import React, { memo } from 'react';
import { Editor } from '@tiptap/react';
import {
  Quote,
  Link as LinkIcon,
  Paintbrush,
  Hash,
  Bold,
  Italic,
  AlignLeft,
} from 'lucide-react';
import { CustomFont, PageData } from '../../../types';

export const ToolbarButton: React.FC<{
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

interface ArticleToolbarProps {
  editor: Editor;
  isAnnotateMode: boolean;
  onSetAnnotateMode: (mode: boolean) => void;
  onAddAnchor: () => void;
  onToggleTheme: () => void;
  onToggleSeq: () => void;
  annotationTheme?: string;
  hideAnnotationSeq?: boolean;
  customFonts: CustomFont[];
}

export const ArticleToolbar: React.FC<ArticleToolbarProps> = ({
  editor,
  isAnnotateMode,
  onSetAnnotateMode,
  onAddAnchor,
  onToggleTheme,
  onToggleSeq,
  annotationTheme,
  hideAnnotationSeq,
  customFonts,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner">
      <div className="flex bg-slate-200 p-0.5 rounded mr-2">
        <button
          onClick={() => onSetAnnotateMode(false)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            !isAnnotateMode ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Edit Article
        </button>
        <button
          onClick={() => onSetAnnotateMode(true)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            isAnnotateMode ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Annotate
        </button>
      </div>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        icon={Quote}
        title={
          editor.isActive('blockquote')
            ? 'Remove emphasis from this paragraph'
            : 'Emphasize this paragraph (blockquote style)'
        }
        isAction={editor.isActive('blockquote')}
      />
      <div className="w-px h-4 bg-slate-300 mx-1" />
      <ToolbarButton
        onClick={onAddAnchor}
        icon={LinkIcon}
        title={
          isAnnotateMode
            ? 'Link to Comment (Creates Note on Right)'
            : 'Switch to Annotate mode to create a comment'
        }
        isAction={true}
        disabled={!isAnnotateMode}
      />
      <div className="w-px h-4 bg-slate-300 mx-1" />
      <ToolbarButton
        onClick={onToggleTheme}
        icon={Paintbrush}
        title={`Theme: ${annotationTheme || 'highlight'}`}
      />
      <ToolbarButton
        onClick={onToggleSeq}
        isActive={!hideAnnotationSeq}
        icon={Hash}
        title={hideAnnotationSeq ? 'Show Numbers' : 'Hide Numbers'}
      />

      <div className="w-px h-4 bg-slate-300 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Italic"
      />
      <div className="w-px h-4 bg-slate-300 mx-1" />
      <select
        value={editor.getAttributes('textStyle').fontSize || ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontSize(v).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer"
        title="Font size"
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
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v) editor.chain().focus().setFontFamily(v).run();
          else editor.chain().focus().unsetFontFamily().run();
        }}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer max-w-[150px]"
        title="Font family"
      >
        <option value="">Font</option>
        <option value="'Inter', sans-serif">Inter</option>
        <option value="'Crimson Pro', serif">Crimson Pro</option>
        <option value="'Noto Serif SC', serif">Noto Serif SC</option>
        {customFonts.map(f => (
          <option key={f.family} value={f.family}>{f.name}</option>
        ))}
      </select>
    </div>
  );
};

export const CommentsToolbar: React.FC<{
  annotationStyle?: string;
  onToggleStyle: () => void;
}> = ({ annotationStyle, onToggleStyle }) => {
  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner justify-end">
      <ToolbarButton
        onClick={onToggleStyle}
        icon={AlignLeft}
        title={`Style: ${annotationStyle === 'single' ? 'Single Line' : 'Dual Line'}`}
      />
    </div>
  );
};
