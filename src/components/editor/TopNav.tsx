import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomOut, ZoomIn, Minimize2, Download, ChevronDown } from 'lucide-react';

import { PageSize } from '../../types';

interface TopNavProps {
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  previewZoom: number;
  onZoomChange: (zoom: number) => void;
  isAutoFit: boolean;
  onToggleAutoFit: () => void;
  onExportPng: (all: boolean) => void;
  isExporting: boolean;
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
}

const TopNav: React.FC<TopNavProps> = ({
  currentPageIndex,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  previewZoom,
  onZoomChange,
  isAutoFit,
  onToggleAutoFit,
  onExportPng,
  isExporting,
  showExportMenu,
  setShowExportMenu,
  exportMenuRef,
  saveStatus = 'saved'
}) => {
  const [focusedMenuIndex, setFocusedMenuIndex] = React.useState<number>(0);

  // Listen for Escape and Arrow keys in export menu
  useEffect(() => {
    if (!showExportMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExportMenu(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedMenuIndex(prev => (prev === 0 ? 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedMenuIndex(prev => (prev === 1 ? 0 : 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExportMenu, setShowExportMenu]);

  return (
    <header className="h-16 px-6 bg-white border-b border-neutral-200 flex justify-between items-center z-10">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-800 tracking-tight">Preview</span>
        <div className="h-4 w-[1px] bg-slate-200" />
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider mr-2">Page {currentPageIndex + 1}</span>
        
        {/* Segmented Control for Page Size */}
        <div className="flex bg-slate-100 p-1 rounded-lg" role="radiogroup" aria-label="Page Size">
          {(['A4', '9:15', 'Unlimited'] as PageSize[]).map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={pageSize === size}
              onClick={() => onPageSizeChange(size)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${
                pageSize === size 
                  ? 'bg-[#264376] text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.2, previewZoom - 0.1))}
            className="p-1 text-slate-500 hover:text-slate-700 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} aria-hidden="true" />
          </button>
          <input 
            type="range"
            min="0.2"
            max="1.5"
            step="0.01" 
            value={previewZoom} 
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            aria-label="Preview zoom level"
            className="w-20 accent-[#264376] h-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
          />
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(1.5, previewZoom + 0.1))}
            className="p-1 text-slate-500 hover:text-slate-700 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} aria-hidden="true" />
          </button>
          <span className="text-[10px] font-bold text-slate-600 min-w-[32px] text-center" aria-live="polite">{Math.round(previewZoom * 100)}%</span>
          
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />

          <button 
            type="button"
            onClick={onToggleAutoFit}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] ${isAutoFit ? 'bg-[#264376] text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
            title="Auto Fit to Height"
            aria-label="Auto fit preview to height"
            aria-pressed={isAutoFit}
          >
            <Minimize2 size={12} aria-hidden="true" />
            <span className="text-[10px] uppercase">Fit</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            aria-label="Previous page"
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === totalPages - 1}
            aria-label="Next page"
            className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <div className="relative ml-2" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              aria-label="Export PNG options"
              className="flex items-center gap-2 bg-[#264376] text-white px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-[#264376]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] focus-visible:ring-offset-2"
            >
              <Download size={18} aria-hidden="true" />
              <span className="text-sm font-bold tracking-tight">{isExporting ? 'Exporting...' : 'Export PNG'}</span>
              <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  role="menu"
                  aria-label="Export PNG formats"
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 mb-1">
                    Select Option
                  </div>
                  <button 
                    type="button"
                    role="menuitem"
                    onClick={() => onExportPng(false)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors ${focusedMenuIndex === 0 ? 'bg-slate-50' : ''}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#264376]" aria-hidden="true" />
                    Current Page
                  </button>
                  <button 
                    type="button"
                    role="menuitem"
                    onClick={() => onExportPng(true)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors ${focusedMenuIndex === 1 ? 'bg-slate-50' : ''}`}
                  >
                    <div className="w-2 h-2 rounded-full border border-[#264376]/30" aria-hidden="true" />
                    All Pages ({totalPages})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
