import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Download, Layout, Type, ChevronLeft, ChevronRight, Settings, ZoomIn, ZoomOut, Maximize, Save, FolderOpen, Eraser, Minimize2, ChevronDown, Home } from 'lucide-react';
import { PageData, PageType, CustomFont, ProjectData } from '../types';
import Editor from '../components/Editor';
import Preview from '../components/Preview';
import FontManager from '../components/FontManager';
import { toPng } from 'html-to-image';
import { saveProject, getProject } from '../utils/db';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_PAGES: PageData[] = [
  {
    id: 'page-1',
    type: 'cover',
    image: 'https://picsum.photos/id/43/1200/1600',
    titleEn: 'Example English Title',
    titleZh: '示例中文标题',
    byline: 'By Author Name | PUBLICATION',
    quoteEn: 'This is an example quote text in English.',
    quoteZh: '这是一段示例引言中文文字。',
    featuredText: '@ExampleBadge',
    footerLeft: 'Footer Left Label',
    footerRight: 'Footer Right Label',
    lineHeight: 1.6,
    backgroundColor: '#FAF9F4',
    titleEnFont: "'Inter', sans-serif",
    titleZhFont: "'Crimson Pro', serif",
    paragraphEnFont: "'Inter', sans-serif",
    paragraphZhFont: "'Crimson Pro', serif",
    bylineFont: "'Inter', sans-serif",
    footerFont: "'Inter', sans-serif"
  }
];

export default function EditorPage() {
  const navigate = useNavigate();
  const { alert, confirm } = useUI();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const [pages, setPages] = useState<PageData[]>(DEFAULT_PAGES);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(0.8);
  const [isAutoFit, setIsAutoFit] = useState(true); 
  const [enforceA4, setEnforceA4] = useState(true);
  const [pagesOverflow, setPagesOverflow] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load from Database
  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const savedData = await getProject(projectId);
        if (savedData) {
          setPages(savedData.pages || DEFAULT_PAGES);
          setCustomFonts(savedData.customFonts || []);
          setEnforceA4(savedData.settings?.enforceA4 ?? true);
        } else if (templateId) {
          // Initialize from template only if not in DB
          let newPages = JSON.parse(JSON.stringify(DEFAULT_PAGES));
          const tid = templateId.toLowerCase();
          
          if (tid === 'classic-cover') {
             newPages[0].layoutId = 'classic-cover';
             newPages[0].type = 'cover';
          } else if (tid === 'impact-bold') {
             newPages[0].layoutId = 'impact-bold';
             newPages[0].type = 'cover';
          } else if (tid === 'cinematic') {
             newPages[0].layoutId = 'cinematic';
             newPages[0].type = 'cover';
          } else if (tid === 'blueprint') {
             newPages[0].layoutId = 'blueprint';
             newPages[0].type = 'cover';
          } else if (tid === 'tabloid') {
             newPages[0].layoutId = 'tabloid';
             newPages[0].type = 'cover';
          } else if (tid === 'typography') {
             newPages[0].layoutId = 'typography';
             newPages[0].type = 'cover';
          } else if (tid === 'classic-article' || tid === 'split-article') {
             newPages[0].layoutId = 'classic-article';
             newPages[0].type = 'article';
             newPages[0].paragraphs = [{ id: 'p-init', en: 'Start writing...', zh: '开始写作...' }];
          }
          setPages(newPages);
        }
        setIsLoaded(true);
      }
    }
    loadData();
  }, [projectId, templateId]);

  // 2. Persist to Database on Change (only after initial load)
  useEffect(() => {
    if (projectId && isLoaded) {
      const projectState = {
        pages,
        customFonts,
        settings: { enforceA4 },
        lastEdited: new Date().toISOString(),
        title: pages[0]?.titleEn || 'Untitled Project'
      };
      
      // Save to IndexedDB
      saveProject(projectId, projectState);

      // Update project index for Dashboard (keep summary in localStorage for fast listing)
      const indexSaved = localStorage.getItem('magazine_recent_projects');
      let index = indexSaved ? JSON.parse(indexSaved) : [];
      
      const existingIdx = index.findIndex((p: any) => p.id === projectId);
      const projectSummary = {
        id: projectId,
        title: projectState.title,
        date: new Date().toLocaleDateString(),
        type: pages[0]?.layoutId || pages[0]?.type || 'Custom'
      };

      if (existingIdx > -1) {
        index[existingIdx] = projectSummary;
      } else {
        index.unshift(projectSummary);
      }
      
      localStorage.setItem('magazine_recent_projects', JSON.stringify(index.slice(0, 10)));
    }
  }, [pages, customFonts, enforceA4, projectId, isLoaded]);

  const currentPage = pages[currentPageIndex];

  // Handle outside click for export menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Robust zoom calculation
  const calculateFitZoom = useCallback(() => {
    if (!previewContainerRef.current) return 0.8;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const containerHeight = rect.height;
    
    if (containerHeight <= 0) return 0.8;

    const padding = 96; // p-12 (48px top + 48px bottom)
    
    let targetHeight = 1131;
    if (previewRef.current) {
      const currentPageEl = previewRef.current.querySelector('.magazine-page-container.block .magazine-page');
      if (currentPageEl) {
        targetHeight = Math.max(1131, currentPageEl.scrollHeight);
      }
    }

    const availableHeight = containerHeight - padding;
    const fitZoom = Math.min(Math.max(0.1, availableHeight / targetHeight), 1.5);
    return fitZoom;
  }, [enforceA4, pages, currentPageIndex]);

  // Use ResizeObserver to detect container size changes reliably
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (isAutoFit) {
        setPreviewZoom(calculateFitZoom());
      }
    });

    observer.observe(previewContainerRef.current);
    
    const timeoutId = setTimeout(() => {
      if (isAutoFit) {
        setPreviewZoom(calculateFitZoom());
      }
    }, 50);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isAutoFit, calculateFitZoom]);

  // Also trigger refit when page index, content, or enforceA4 changes
  useEffect(() => {
    if (isAutoFit) {
      setPreviewZoom(calculateFitZoom());
    }
  }, [currentPageIndex, enforceA4, isAutoFit, calculateFitZoom, pages]);

  const updatePage = (updatedPage: PageData) => {
    const originalPage = pages.find(p => p.id === updatedPage.id);
    if (!originalPage) return;
    
    // --- Robust Type Switching with Memory ---
    if (updatedPage.type !== originalPage.type) {
      if (updatedPage.type === 'article') {
        // Remember current cover layout
        updatedPage.lastCoverLayoutId = originalPage.layoutId;
        // Restore last article layout or use default
        updatedPage.layoutId = updatedPage.lastArticleLayoutId || 'classic-article';
        
        if (!updatedPage.paragraphs || updatedPage.paragraphs.length === 0) {
          updatedPage.paragraphs = [{ id: `p-${Date.now()}`, en: '', zh: '' }];
        }
      } else {
        // Remember current article layout
        updatedPage.lastArticleLayoutId = originalPage.layoutId;
        // Restore last cover layout or use default
        updatedPage.layoutId = updatedPage.lastCoverLayoutId || 'classic-cover';
      }
    } else {
      // Type didn't change, but layout might have. Keep memory updated.
      if (updatedPage.type === 'cover') {
        updatedPage.lastCoverLayoutId = updatedPage.layoutId;
      } else {
        updatedPage.lastArticleLayoutId = updatedPage.layoutId;
      }
    }
    
    const fontFields: Array<keyof PageData> = [
      'titleEnFont', 'titleZhFont', 'bylineFont', 'quoteEnFont', 'quoteZhFont',
      'footerFont', 'paragraphEnFont', 'paragraphZhFont', 'footnoteFont',
      'lineHeight', 'paragraphSpacing', 'backgroundColor'
    ];
    
    const changedFontFields: Array<keyof PageData> = [];
    fontFields.forEach(field => {
      if (originalPage[field] !== updatedPage[field]) {
        changedFontFields.push(field);
      }
    });
    
    if (changedFontFields.length > 0) {
      setPages(prev => prev.map(page => {
        const updatedPageData: PageData = { ...page };
        if (page.id === updatedPage.id) {
           Object.assign(updatedPageData, updatedPage);
        }
        changedFontFields.forEach(field => {
          updatedPageData[field] = updatedPage[field];
        });
        return updatedPageData;
      }));
    } else {
      setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    }
  };

  const registerFontInDOM = useCallback((family: string, dataUrl: string) => {
    if (document.getElementById(`style-${family}`)) return;
    const style = document.createElement('style');
    style.id = `style-${family}`;
    style.innerHTML = `
      @font-face {
        font-family: '${family}';
        src: url('${dataUrl}');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleExportProject = () => {
    const project: ProjectData = {
      version: "1.0",
      pages,
      customFonts,
      settings: { enforceA4 }
    };
    
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${new Date().toISOString().slice(0, 10)}.wdzmaga`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project: ProjectData = JSON.parse(event.target?.result as string);
        
        project.customFonts.forEach(font => {
          if (font.dataUrl) {
            registerFontInDOM(font.family, font.dataUrl);
          }
        });
        
        setCustomFonts(project.customFonts || []);
        setPages(project.pages || DEFAULT_PAGES);
        setEnforceA4(project.settings?.enforceA4 ?? true);
        setCurrentPageIndex(0);
        setIsAutoFit(true);
        
        alert("Import Success", "Project data has been loaded successfully.");
      } catch (err) {
        console.error("Import failed:", err);
        alert("Import Error", "Failed to import project. Invalid file format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPage = (type: PageType) => {
    const firstPage = pages[0];
    const newPage: PageData = {
      id: `page-${Date.now()}`,
      type,
      layoutId: type === 'cover' ? 'classic-cover' : 'classic-article',
      image: 'https://picsum.photos/1200/1600',
      titleEn: firstPage.titleEn,
      titleZh: firstPage.titleZh,
      byline: firstPage.byline,
      footerLeft: firstPage.footerLeft,
      footerRight: firstPage.footerRight,
      lineHeight: firstPage.lineHeight || 1.6,
      titleEnFont: firstPage.titleEnFont,
      titleZhFont: firstPage.titleZhFont,
      bylineFont: firstPage.bylineFont,
      quoteEnFont: firstPage.quoteEnFont,
      quoteZhFont: firstPage.quoteZhFont,
      footerFont: firstPage.footerFont,
      paragraphEnFont: firstPage.paragraphEnFont,
      paragraphZhFont: firstPage.paragraphZhFont,
      footnoteFont: firstPage.footnoteFont,
      paragraphs: type === 'article' ? [{ id: `p-${Date.now()}`, en: 'New paragraph text in English.', zh: '新的中文段落文字。' }] : undefined,
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) {
      handleClearAll();
      return;
    }
    
    confirm(
      "Delete Page",
      "Are you sure you want to delete this page? This action will remove all content on this page.",
      () => {
        setPages(prev => prev.filter(p => p.id !== id));
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
      }
    );
  };

  const handleClearAll = () => {
    confirm(
      "Reset Project",
      "Are you sure you want to clear all pages? This will permanently reset the current project state.",
      () => {
        setPages([
          {
            id: `page-${Date.now()}`,
            type: 'cover',
            layoutId: 'classic-cover',
            image: '',
            titleEn: 'Untitled Project',
            titleZh: '未命名项目',
            byline: 'Author Name',
            footerLeft: 'Footer L',
            footerRight: 'Footer R',
            lineHeight: 1.6
          }
        ]);
        setCurrentPageIndex(0);
        setIsAutoFit(true);
      }
    );
  };

  const exportAsPng = async (exportAll: boolean = false) => {
    if (!previewRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const prevZoom = previewZoom;
      const prevPageIndex = currentPageIndex;
      setPreviewZoom(1);
      await new Promise(resolve => setTimeout(resolve, 300));
      const pagesToExport = exportAll ? pages : [pages[currentPageIndex]];
      for (let i = 0; i < pagesToExport.length; i++) {
        const pageIdx = exportAll ? i : prevPageIndex;
        if (exportAll) {
          setCurrentPageIndex(i);
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        const pageElements = previewRef.current.getElementsByClassName('magazine-page');
        const targetElement = pageElements[exportAll ? i : prevPageIndex] as HTMLElement;
        if (!targetElement) continue;
        const dataUrl = await toPng(targetElement, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = `magazine-page-${pageIdx + 1}.png`;
        link.href = dataUrl;
        link.click();
        if (exportAll) await new Promise(resolve => setTimeout(resolve, 300));
      }
      setPreviewZoom(prevZoom);
      if (exportAll) setCurrentPageIndex(prevPageIndex);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualZoom = (value: number) => {
    setIsAutoFit(false);
    setPreviewZoom(value);
  };

  const toggleFit = () => {
    setIsAutoFit(!isAutoFit);
  };

  const handleOverflowChange = (pageId: string, isOverflowing: boolean) => {
    setPagesOverflow(prev => {
      if (prev[pageId] === isOverflowing) return prev;
      return { ...prev, [pageId]: isOverflowing };
    });
  };

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -64 }}
        animate={{ x: 0 }}
        className="w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 gap-4 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-[#264376] text-white rounded-xl mb-4 shadow-lg shadow-[#264376]/20 hover:scale-110 active:scale-95 transition-all"
          title="Back to Dashboard"
        >
          <Layout size={20} />
        </button>
        
        <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar pt-2">
          {pages.map((p, idx) => (
            <motion.button
              layout
              key={p.id}
              onClick={() => setCurrentPageIndex(idx)}
              className={`w-10 h-14 min-h-[56px] rounded-lg transition-all flex items-center justify-center text-sm font-black tracking-widest shadow-sm border-l-4
                ${idx === currentPageIndex 
                  ? 'border-[#264376] bg-white text-[#264376] shadow-md translate-x-1' 
                  : 'border-transparent bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600'}`}
            >
              {idx + 1}
            </motion.button>
          ))}

          <button 
            onClick={() => addPage('article')}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all mt-2"
            title="Add Article Page"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pb-4">
          <button 
            onClick={handleClearAll}
            className="w-10 h-10 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
            title="Clear All Pages"
          >
            <Eraser size={18} />
          </button>

          <div className="w-8 h-[1px] bg-slate-100" />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"
            title="Import Project (.wdzmaga)"
          >
            <FolderOpen size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".wdzmaga" 
            onChange={handleImportProject} 
          />

          <button 
            onClick={handleExportProject}
            className="w-10 h-10 rounded-full text-slate-400 hover:bg-green-50 hover:text-green-600 flex items-center justify-center transition-all"
            title="Export Project (.wdzmaga)"
          >
            <Save size={18} />
          </button>

          <div className="w-8 h-[1px] bg-slate-100" />

          <button 
            onClick={() => setShowFontManager(!showFontManager)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showFontManager ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Font Manager"
          >
            <Settings size={18} />
          </button>
        </div>
      </motion.div>

      <div className="flex-1 flex overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-neutral-200/50 flex flex-col overflow-hidden relative"
        >
          <div className="h-16 px-6 bg-white border-b border-neutral-200 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 tracking-tight">Preview</span>
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Page {currentPageIndex + 1}</span>
              
              <button 
                onClick={() => setEnforceA4(!enforceA4)}
                className={`ml-4 flex items-center gap-1.5 px-2 py-1 rounded border transition-all text-[10px] font-bold uppercase ${enforceA4 ? 'bg-[#264376] border-[#264376] text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Maximize size={10} />
                Fixed A4
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                <button onClick={() => handleManualZoom(Math.max(0.2, previewZoom - 0.1))} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <ZoomOut size={14} />
                </button>
                <input 
                  type="range" min="0.2" max="1.5" step="0.01" 
                  value={previewZoom} 
                  onChange={(e) => handleManualZoom(parseFloat(e.target.value))}
                  className="w-20 accent-[#264376] h-1"
                />
                <button onClick={() => handleManualZoom(Math.min(1.5, previewZoom + 0.1))} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <ZoomIn size={14} />
                </button>
                <span className="text-[10px] font-bold text-slate-500 min-w-[32px] text-center">{Math.round(previewZoom * 100)}%</span>
                
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                <button 
                  onClick={toggleFit}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${isAutoFit ? 'bg-[#264376] text-white font-bold' : 'text-slate-400 hover:bg-slate-50'}`}
                  title="Auto Fit to Height"
                >
                  <Minimize2 size={12} />
                  <span className="text-[10px] uppercase">Fit</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <button
                  onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPageIndex === 0}
                  className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                  disabled={currentPageIndex === pages.length - 1}
                  className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="relative ml-2" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-[#264376] text-white px-4 py-2 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-[#264376]/20"
                  >
                    <Download size={18} />
                    <span className="text-sm font-bold tracking-tight">{isExporting ? 'Exporting...' : 'Export PNG'}</span>
                    <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-1">
                          Select Option
                        </div>
                        <button 
                          onClick={() => exportAsPng(false)}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-[#264376]" />
                          Current Page
                        </button>
                        <button 
                          onClick={() => exportAsPng(true)}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full border border-[#264376]/30" />
                          All Pages ({pages.length})
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-12 no-scrollbar bg-neutral-200/50" ref={previewContainerRef}>
             <div 
              className="flex flex-col items-center gap-12 origin-top"
              ref={previewRef}
              style={{ transform: `scale(${previewZoom})` }}
             >
               {pages.map((page, idx) => (
                 <div 
                  key={page.id} 
                  className={`magazine-page-container ${idx === currentPageIndex ? 'block' : 'hidden'} shadow-2xl shadow-slate-300/50`}
                 >
                   <Preview 
                    page={page} 
                    pageIndex={idx} 
                    totalPages={pages.length} 
                    enforceA4={enforceA4} 
                    onOverflowChange={(overflow) => handleOverflowChange(page.id, overflow)}
                   />
                 </div>
               ))}
             </div>
          </div>

          <AnimatePresence>
            {showFontManager && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-4 left-4 z-20"
              >
                <FontManager fonts={customFonts} onFontsChange={setCustomFonts} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Editor Panel */}
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
              onClick={() => removePage(currentPage.id)} 
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
                onClick={() => updatePage({ ...currentPage, type: 'cover' })}
                className={`flex-1 py-2 px-3 rounded-md transition-all ${currentPage.type === 'cover' ? 'bg-white text-[#264376] shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                Cover
              </button>
              <button
                onClick={() => updatePage({ ...currentPage, type: 'article' })}
                className={`flex-1 py-2 px-3 rounded-md transition-all ${currentPage.type === 'article' ? 'bg-white text-[#264376] shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              >
                Article
              </button>
            </div>

            <Editor 
              page={currentPage} 
              onUpdate={updatePage} 
              customFonts={customFonts} 
              isOverflowing={pagesOverflow[currentPage.id]}
              enforceA4={enforceA4}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}