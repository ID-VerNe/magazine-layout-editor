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
import { checkExportPageName } from '../state/regressionChecks';

export default function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const {
    pages,
    currentPageId,
    currentPageIndex,
    setCurrentPageIndex,
    currentPage,
    customFonts,
    setCustomFonts,
    pageSize,
    setPageSize,
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
  } = usePreview({ pageSize, pages, currentPageIndex });

  const [isExporting, setIsExporting] = useState(false);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (projectId && isLoaded) {
      timeout = setTimeout(() => saveToDB(previewRef, { generateThumbnail: false }), 1000);
    }
    return () => clearTimeout(timeout);
  }, [pages, customFonts, pageSize, projectId, isLoaded, saveToDB, previewRef]);

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
      setPreviewZoom(1);
      // Wait for zoom change to render
      await new Promise(resolve => setTimeout(resolve, 300));

      const pageIdsToExport = exportAll ? pages.map(page => page.id) : (currentPageId ? [currentPageId] : []);
      const pagePositions = new Map(pages.map((page, index) => [page.id, index + 1]));
      const containers = pageIdsToExport.map((pageId) =>
        previewRef.current?.querySelector(`.magazine-page-container[data-page-id="${pageId}"]`) as HTMLElement | null
      );
      const previousDisplay = new Map<HTMLElement, string>();

      containers.forEach(container => {
        if (container) {
          previousDisplay.set(container, container.style.display);
          container.style.display = 'block';
        }
      });

      await new Promise(resolve => setTimeout(resolve, 250));

      for (let i = 0; i < pageIdsToExport.length; i++) {
        const pageId = pageIdsToExport[i];
        const container = containers[i];
        const targetElement = container?.querySelector('.magazine-page') as HTMLElement;
        if (!targetElement) {
          console.warn(`Skipping page export: element not found for ${pageId}`);
          continue;
        }
        const sourcePage = pages.find(page => page.id === pageId);
        const pageNumber = pagePositions.get(pageId) || i + 1;

        try {
          const dataUrl = await toPng(targetElement, {
            quality: 1,
            pixelRatio: 2,
            backgroundColor: sourcePage?.backgroundColor || '#FAF9F4',
          });

          const link = document.createElement('a');
          link.download = `magazine-page-${pageNumber}.png`;
          if (import.meta.env.DEV && !checkExportPageName(pageNumber, link.download)) {
            console.warn('[export-check] unexpected export filename', { pageId, pageNumber, file: link.download });
          }
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error(`Failed to export page ${pageNumber}:`, err);
          // Continue with remaining pages instead of aborting
        }
        if (exportAll) await new Promise(resolve => setTimeout(resolve, 120));
      }

      containers.forEach(container => {
        if (container) {
          container.style.display = previousDisplay.get(container) || '';
        }
      });

      setPreviewZoom(prevZoom);
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
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
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
            pageSize={pageSize}
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
          enforceA4={pageSize !== 'Unlimited'}
        />
      </div>
    </div>
  );
}
