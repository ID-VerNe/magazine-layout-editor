import React from 'react';
import { motion } from 'framer-motion';
import { Type, Trash2 } from 'lucide-react';
import Editor from '../Editor';
import { PageData, CustomFont } from '../../types';

interface EditorPanelProps {
  currentPage: PageData;
  onUpdatePage: (page: PageData) => void;
  onRemovePage: (id: string) => void;
  customFonts: CustomFont[];
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  currentPage,
  onUpdatePage,
  onRemovePage,
  customFonts,
  isOverflowing,
  enforceA4
}) => {
  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="w-[400px] bg-white border-l border-neutral-200 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.05)] z-20"
    >
      <div className="h-16 px-6 border-b border-neutral-100 bg-white flex justify-between items-center shrink-0">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Type size={18} className="text-slate-400" />
          Editor
        </h2>
        <button 
          onClick={() => onRemovePage(currentPage.id)} 
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete page"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {/* Segmented Control Switcher */}
        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-black uppercase tracking-widest">
          <button
            onClick={() => onUpdatePage({ ...currentPage, type: 'cover' })}
            className={`flex-1 py-2 px-3 rounded-md transition-all ${currentPage.type === 'cover' ? 'bg-white text-[#264376] shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Cover
          </button>
          <button
            onClick={() => onUpdatePage({ ...currentPage, type: 'article' })}
            className={`flex-1 py-2 px-3 rounded-md transition-all ${currentPage.type === 'article' ? 'bg-white text-[#264376] shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
          >
            Article
          </button>
        </div>

        <Editor 
          page={currentPage} 
          onUpdate={onUpdatePage} 
          customFonts={customFonts} 
          isOverflowing={isOverflowing}
          enforceA4={enforceA4}
        />
      </div>
    </motion.div>
  );
};

export default EditorPanel;
