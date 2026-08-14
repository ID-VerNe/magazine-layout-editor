import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FolderOpen, Save, Settings, Eraser } from 'lucide-react';
import { PageData, PageType } from '../../types';

interface SidebarProps {
  pages: PageData[];
  currentPageIndex: number;
  onPageSelect: (index: number) => void;
  onAddPage: (type: PageType) => void;
  onClearAll: () => void;
  onImport: () => void;
  onExport: () => void;
  onToggleFontManager: () => void;
  showFontManager: boolean;
  onNavigateHome: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  pages,
  currentPageIndex,
  onPageSelect,
  onAddPage,
  onClearAll,
  onImport,
  onExport,
  onToggleFontManager,
  showFontManager,
  onNavigateHome
}) => {
  return (
    <motion.div 
      initial={{ x: -64 }}
      animate={{ x: 0 }}
      className="w-16 bg-white border-r border-neutral-200 flex flex-col items-center z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      <div className="w-16 h-16 flex items-center justify-center shrink-0">
        <button 
          type="button"
          onClick={onNavigateHome}
          className="w-10 h-10 bg-[#264376] text-white rounded-xl shadow-lg shadow-[#264376]/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center font-black text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] focus-visible:ring-offset-2"
          title="Back to Dashboard"
          aria-label="Back to Dashboard"
        >
          M
        </button>
      </div>
      
      <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar pt-2 pb-4">
        {pages.map((p, idx) => (
          <motion.button
            layout
            key={p.id}
            onClick={() => onPageSelect(idx)}
            aria-label={`Go to page ${idx + 1}`}
            aria-current={idx === currentPageIndex ? 'page' : undefined}
            className={`w-10 h-14 min-h-[56px] rounded-lg transition-all flex items-center justify-center text-sm font-black tracking-widest shadow-sm border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]
              ${idx === currentPageIndex 
                ? 'border-[#264376] bg-white text-[#264376] shadow-md translate-x-1' 
                : 'border-transparent bg-slate-50 text-slate-500 hover:bg-white hover:text-slate-700'}`}
          >
            {idx + 1}
          </motion.button>
        ))}

        <button 
          type="button"
          onClick={() => onAddPage('article')}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#264376] flex items-center justify-center transition-all mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
          title="Add Article Page"
          aria-label="Add Article Page"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-4">
        <button 
          type="button"
          onClick={onClearAll}
          className="w-10 h-10 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          title="Clear All Pages"
          aria-label="Clear All Pages"
        >
          <Eraser size={18} aria-hidden="true" />
        </button>

        <div className="w-8 h-[1px] bg-slate-100" />

        <button 
          type="button"
          onClick={onImport}
          className="w-10 h-10 rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          title="Import Project (.wdzmaga)"
          aria-label="Import Project (.wdzmaga)"
        >
          <FolderOpen size={18} aria-hidden="true" />
        </button>

        <button 
          type="button"
          onClick={onExport}
          className="w-10 h-10 rounded-full text-slate-500 hover:bg-green-50 hover:text-green-600 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          title="Export Project (.wdzmaga)"
          aria-label="Export Project (.wdzmaga)"
        >
          <Save size={18} aria-hidden="true" />
        </button>

        <div className="w-8 h-[1px] bg-slate-100" />

        <button 
          type="button"
          onClick={onToggleFontManager}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${showFontManager ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          title="Font Manager"
          aria-label="Toggle Font Manager"
          aria-expanded={showFontManager}
        >
          <Settings size={18} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
