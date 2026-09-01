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
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    aria-pressed={isActive}
    disabled={disabled}
    className={`p-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${
      disabled
        ? 'opacity-40 cursor-not-allowed text-slate-400'
        : isActive
          ? 'bg-[#264376] text-white shadow-sm ring-2 ring-[#264376]/30'
          : isAction
            ? 'text-slate-700 bg-white shadow-sm border border-slate-200 hover:bg-slate-50'
            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
    }`}
  >
    <Icon size={14} aria-hidden="true" />
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
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;

  // 字号/字体是 mark 类命令，必须有选中文本才生效。
  // 无选区时给出明确提示，避免“选了没反应”的静默失败。
  const handleStyleChange = (prop: 'fontSize' | 'fontFamily') => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!hasSelection) {
      const label = prop === 'fontFamily' ? '字体' : '字号';
      window.alert(`请先在正文中选中要修改${label}的文字，再进行设置。`);
      return;
    }
    const chain = editor.chain().focus();
    if (prop === 'fontSize') {
      if (v) chain.setFontSize(v).run();
      else chain.unsetFontSize().run();
    } else {
      if (v) chain.setFontFamily(v).run();
      else chain.unsetFontFamily().run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner">
      <div className="flex bg-slate-200 p-0.5 rounded mr-2">
        <button
          type="button"
          onClick={() => onSetAnnotateMode(false)}
          aria-pressed={!isAnnotateMode}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${
            !isAnnotateMode ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Edit Article
        </button>
        <button
          type="button"
          onClick={() => onSetAnnotateMode(true)}
          aria-pressed={isAnnotateMode}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${
            isAnnotateMode ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'
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
        aria-label="Article text font size"
        disabled={isAnnotateMode}
        onChange={handleStyleChange('fontSize')}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={isAnnotateMode ? '请先切换到 Edit Article 模式' : '字号：先选中文字再生效'}
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
        aria-label="Article text font family"
        disabled={isAnnotateMode}
        onChange={handleStyleChange('fontFamily')}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer max-w-[150px] disabled:opacity-40 disabled:cursor-not-allowed"
        title={isAnnotateMode ? '请先切换到 Edit Article 模式' : '字体：先选中文字再生效'}
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
