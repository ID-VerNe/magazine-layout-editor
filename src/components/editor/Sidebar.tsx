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
          onClick={onNavigateHome}
          className="w-10 h-10 bg-[#264376] text-white rounded-xl shadow-lg shadow-[#264376]/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center font-black text-sm"
          title="Back to Dashboard"
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
            className={`w-10 h-14 min-h-[56px] rounded-lg transition-all flex items-center justify-center text-sm font-black tracking-widest shadow-sm border-l-4
              ${idx === currentPageIndex 
                ? 'border-[#264376] bg-white text-[#264376] shadow-md translate-x-1' 
                : 'border-transparent bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600'}`}
          >
            {idx + 1}
          </motion.button>
        ))}

        <button 
          onClick={() => onAddPage('article')}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all mt-2"
          title="Add Article Page"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-4">
        <button 
          onClick={onClearAll}
          className="w-10 h-10 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
          title="Clear All Pages"
        >
          <Eraser size={18} />
        </button>

        <div className="w-8 h-[1px] bg-slate-100" />

        <button 
          onClick={onImport}
          className="w-10 h-10 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"
          title="Import Project (.wdzmaga)"
        >
          <FolderOpen size={18} />
        </button>

        <button 
          onClick={onExport}
          className="w-10 h-10 rounded-full text-slate-400 hover:bg-green-50 hover:text-green-600 flex items-center justify-center transition-all"
          title="Export Project (.wdzmaga)"
        >
          <Save size={18} />
        </button>

        <div className="w-8 h-[1px] bg-slate-100" />

        <button 
          onClick={onToggleFontManager}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showFontManager ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
          title="Font Manager"
        >
          <Settings size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
