import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useProject } from '../hooks/useProject';
import { usePreview } from '../hooks/usePreview';
import Sidebar from '../components/editor/Sidebar';
import TopNav from '../components/editor/TopNav';
import PreviewArea from '../components/editor/PreviewArea';
import EditorPanel from '../components/editor/EditorPanel';
import FontManager from '../components/FontManager';
import { exportPagesAsPng } from '../utils/exportUtils';

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
    saveToDB,
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
    handleOverflowChange,
  } = usePreview({ pageSize, pages, currentPageIndex });

  const [isExporting, setIsExporting] = useState(false);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveToDBRef = useRef(saveToDB);
  saveToDBRef.current = saveToDB;

  // Auto-save logic with flush on unmount to prevent data loss when navigating away
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let pendingSave = false;

    if (projectId && isLoaded) {
      pendingSave = true;
      timeout = setTimeout(() => {
        pendingSave = false;
        saveToDBRef.current(previewRef, { generateThumbnail: false });
      }, 1000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (pendingSave && projectId && isLoaded) {
        // Flush pending save immediately on unmount/route change
        saveToDBRef.current(previewRef, { generateThumbnail: false });
      }
    };
  }, [pages, customFonts, pageSize, projectId, isLoaded, previewRef]);

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

  const handleExportPng = async (exportAll: boolean = false) => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportPagesAsPng({
        exportAll,
        pages,
        currentPageId,
        previewRef,
        previewZoom,
        setPreviewZoom,
      });
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
            onExportPng={handleExportPng}
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
