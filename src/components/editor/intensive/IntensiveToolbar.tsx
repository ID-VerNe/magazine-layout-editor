import React, { memo, useEffect, useRef, useState } from 'react';
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
import { CustomFont } from '../../../types';

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

/**
 * 带文字的状态开关。纯图标 + 悬停 tooltip 无法表达「当前是什么状态」，
 * 主题/编号/排版这类开关需要一眼可见的标签。
 */
export const ToolbarChip: React.FC<{
  onClick: () => void;
  label: string;
  title: string;
  isActive?: boolean;
  icon?: React.ElementType;
  disabled?: boolean;
}> = memo(({ onClick, label, title, isActive, icon: Icon, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    aria-pressed={isActive}
    disabled={disabled}
    className={`flex items-center gap-1 px-1.5 py-1 text-[10px] font-semibold rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${
      disabled
        ? 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200 bg-white'
        : isActive
          ? 'bg-[#264376] text-white border-[#264376] shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {Icon && <Icon size={12} aria-hidden="true" />}
    {label}
  </button>
));

const THEME_LABELS: Record<string, string> = {
  highlight: 'Highlight',
  underline: 'Underline',
  both: 'Both',
};

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

  // 点击 <select> 会让编辑器失焦并可能折叠选区，onChange 时原选区已丢失。
  // 这里始终记住最近一次有效的非折叠选区，供设置字号/字体时恢复。
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);
  if (hasSelection) {
    savedSelectionRef.current = { from, to };
  }

  // 无选区时的提示改用工具条内联消息，避免 window.alert 打断操作
  const [hint, setHint] = useState('');
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHint = (message: string) => {
    setHint(message);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(''), 3000);
  };
  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  // 字号/字体是 mark 类命令，必须有选中文本才生效。
  // 无选区时给出明确提示，避免“选了没反应”的静默失败。
  const handleStyleChange = (prop: 'fontSize' | 'fontFamily') => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    // 优先使用当前选区；若因失焦已折叠，则恢复最近一次保存的有效选区。
    const sel = editor.state.selection;
    const range = sel.from !== sel.to
      ? { from: sel.from, to: sel.to }
      : savedSelectionRef.current;
    if (!range) {
      const label = prop === 'fontFamily' ? 'font' : 'size';
      showHint(`Select text in the article first, then choose a ${label}.`);
      return;
    }
    const chain = editor.chain().focus();
    if (sel.from === sel.to) {
      chain.setTextSelection(range);
    }
    if (prop === 'fontSize') {
      if (v) chain.setFontSize(v).run();
      else chain.unsetFontSize().run();
    } else {
      if (v) chain.setFontFamily(v).run();
      else chain.unsetFontFamily().run();
    }
  };

  // 下拉框展开前再次记录选区（此刻编辑器尚未失焦），双保险。
  const rememberSelection = () => {
    const sel = editor.state.selection;
    if (sel.from !== sel.to) {
      savedSelectionRef.current = { from: sel.from, to: sel.to };
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner"
      onMouseDown={(e) => {
        // 按钮等控件阻止默认聚焦，避免编辑器失焦导致选区丢失；
        // <select> 需正常展开下拉故放行，选区通过 savedSelectionRef 恢复。
        if ((e.target as HTMLElement).closest('select, option')) return;
        e.preventDefault();
      }}
    >
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
            ? 'Add a comment for the selection'
            : 'Switch to Annotate mode to add a comment'
        }
        isAction={true}
        disabled={!isAnnotateMode}
      />
      <div className="w-px h-4 bg-slate-300 mx-1" />
      <ToolbarChip
        onClick={onToggleTheme}
        icon={Paintbrush}
        label={THEME_LABELS[annotationTheme || 'highlight'] || 'Highlight'}
        title={`Marker style: ${annotationTheme || 'highlight'}. Click to switch.`}
      />
      <ToolbarChip
        onClick={onToggleSeq}
        icon={Hash}
        isActive={!hideAnnotationSeq}
        label="Numbers"
        title={hideAnnotationSeq ? 'Show numbers next to marks' : 'Hide numbers next to marks'}
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
        onMouseDown={rememberSelection}
        onChange={handleStyleChange('fontSize')}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={isAnnotateMode ? 'Switch to Edit Article mode to change text size' : 'Select text first, then choose a size'}
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
        onMouseDown={rememberSelection}
        onChange={handleStyleChange('fontFamily')}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer max-w-[150px] disabled:opacity-40 disabled:cursor-not-allowed"
        title={isAnnotateMode ? 'Switch to Edit Article mode to change font' : 'Select text first, then choose a font'}
      >
        <option value="">Font</option>
        <option value="'Inter', sans-serif">Inter</option>
        <option value="'Crimson Pro', serif">Crimson Pro</option>
        <option value="'Noto Serif SC', serif">Noto Serif SC</option>
        {customFonts.map(f => (
          <option key={f.family} value={f.family}>{f.name}</option>
        ))}
      </select>
      {hint && (
        <p
          role="status"
          aria-live="polite"
          className="basis-full text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1"
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export const CommentsToolbar: React.FC<{
  annotationStyle?: string;
  onToggleStyle: () => void;
}> = ({ annotationStyle, onToggleStyle }) => {
  const isSingle = annotationStyle === 'single';
  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg shadow-inner justify-end">
      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mr-1">Notes layout</span>
      <ToolbarChip
        onClick={onToggleStyle}
        icon={AlignLeft}
        label={isSingle ? 'Single line' : 'Dual line'}
        title={`Comment layout: ${isSingle ? 'single line' : 'dual line'}. Click to switch.`}
      />
    </div>
  );
};
