import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';

import { useProject } from '../hooks/useProject';
import { usePreview } from '../hooks/usePreview';
import Sidebar from '../components/editor/Sidebar';
import TopNav from '../components/editor/TopNav';
import PreviewArea from '../components/editor/PreviewArea';
import EditorPanel from '../components/editor/EditorPanel';
import FontManager from '../components/FontManager';

export default function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const {
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    currentPage,
    customFonts,
    setCustomFonts,
    enforceA4,
    setEnforceA4,
    isLoaded,
    updatePage,
    addPage,
    removePage,
    handleClearAll,
    handleExportProject,
    handleImportProject,
    saveToDB
  } = useProject(projectId, templateId);

  const {
    previewZoom,
    setPreviewZoom,
    isAutoFit,
    pagesOverflow,
    previewRef,
    previewContainerRef,
    handleManualZoom,
    toggleFit,
    handleOverflowChange
  } = usePreview({ enforceA4, pages, currentPageIndex });

  const [isExporting, setIsExporting] = useState(false);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (projectId && isLoaded) {
      timeout = setTimeout(() => saveToDB(previewRef), 1000);
    }
    return () => clearTimeout(timeout);
  }, [pages, customFonts, enforceA4, projectId, isLoaded, saveToDB, previewRef]);

  // Outside click for export menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden font-sans">
      <Sidebar 
        pages={pages}
        currentPageIndex={currentPageIndex}
        onPageSelect={setCurrentPageIndex}
        onAddPage={addPage}
        onClearAll={handleClearAll}
        onImport={() => fileInputRef.current?.click()}
        onExport={handleExportProject}
        onToggleFontManager={() => setShowFontManager(!showFontManager)}
        showFontManager={showFontManager}
        onNavigateHome={() => navigate('/')}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".wdzmaga" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportProject(file);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }} 
      />

      <div className="flex-1 flex overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-neutral-200/50 flex flex-col overflow-hidden relative"
        >
          <TopNav 
            currentPageIndex={currentPageIndex}
            totalPages={pages.length}
            onPageChange={setCurrentPageIndex}
            enforceA4={enforceA4}
            onToggleEnforceA4={() => setEnforceA4(!enforceA4)}
            previewZoom={previewZoom}
            onZoomChange={handleManualZoom}
            isAutoFit={isAutoFit}
            onToggleAutoFit={toggleFit}
            onExportPng={exportAsPng}
            isExporting={isExporting}
            showExportMenu={showExportMenu}
            setShowExportMenu={setShowExportMenu}
            exportMenuRef={exportMenuRef}
          />
          
          <PreviewArea 
            pages={pages}
            currentPageIndex={currentPageIndex}
            previewZoom={previewZoom}
            previewRef={previewRef}
            previewContainerRef={previewContainerRef}
            enforceA4={enforceA4}
            onOverflowChange={handleOverflowChange}
          />

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

        <EditorPanel 
          currentPage={currentPage}
          onUpdatePage={updatePage}
          onRemovePage={removePage}
          customFonts={customFonts}
          isOverflowing={pagesOverflow[currentPage.id]}
          enforceA4={enforceA4}
        />
      </div>
    </div>
  );
}
