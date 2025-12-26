import { useState, useEffect, useCallback, useRef } from 'react';
import { PageData, CustomFont, ProjectData, PageType } from '../types';
import { getProject, saveProject } from '../utils/db';
import { toPng } from 'html-to-image';
import { useUI } from '../context/UIContext';

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

export const registerFontInDOM = (family: string, dataUrl: string) => {
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
};

export function useProject(projectId: string | undefined, templateId: string | null) {
  const { alert, confirm } = useUI();
  const [pages, setPages] = useState<PageData[]>(DEFAULT_PAGES);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [enforceA4, setEnforceA4] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Initial Load
  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const savedData = await getProject(projectId);
        if (savedData) {
          setPages(savedData.pages || DEFAULT_PAGES);
          setCustomFonts(savedData.customFonts || []);
          setEnforceA4(savedData.settings?.enforceA4 ?? true);
          
          savedData.customFonts?.forEach((font: CustomFont) => {
            if (font.dataUrl) registerFontInDOM(font.family, font.dataUrl);
          });
        } else if (templateId) {
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

  // Persist to DB
  const saveToDB = useCallback(async (previewRef: React.RefObject<HTMLDivElement | null>) => {
    if (!projectId || !isLoaded) return;

    let thumbnail = null;
    if (previewRef.current) {
      try {
        const pageEl = previewRef.current.querySelector('.magazine-page') as HTMLElement;
        if (pageEl) {
          thumbnail = await toPng(pageEl, {
            pixelRatio: 0.2,
            quality: 0.5,
          });
        }
      } catch (e) {
        console.error("Thumb failed", e);
      }
    }

    const projectState = {
      pages,
      customFonts,
      settings: { enforceA4 },
      lastEdited: new Date().toISOString(),
      title: pages[0]?.titleEn || 'Untitled Project'
    };
    
    await saveProject(projectId, projectState);

    const indexSaved = localStorage.getItem('magazine_recent_projects');
    let index = indexSaved ? JSON.parse(indexSaved) : [];
    
    const existingIdx = index.findIndex((p: any) => p.id === projectId);
    const projectSummary = {
      id: projectId,
      title: projectState.title,
      date: new Date().toLocaleDateString(),
      type: pages[0]?.layoutId || pages[0]?.type || 'Custom',
      thumbnail
    };

    if (existingIdx > -1) {
      index[existingIdx] = projectSummary;
    } else {
      index.unshift(projectSummary);
    }
    
    localStorage.setItem('magazine_recent_projects', JSON.stringify(index.slice(0, 12)));
  }, [pages, customFonts, enforceA4, projectId, isLoaded]);

  useEffect(() => {
    // We can't easily trigger the thumbnail generation here without passing the ref
    // For now, let's just save the data. The thumbnail will be updated when saveToDB is called explicitly or handled in EditorPage
  }, [pages, customFonts, enforceA4]);

  const updatePage = (updatedPage: PageData) => {
    const originalPage = pages.find(p => p.id === updatedPage.id);
    if (!originalPage) return;
    
    // Type Switching Logic
    if (updatedPage.type !== originalPage.type) {
      if (updatedPage.type === 'article') {
        updatedPage.lastCoverLayoutId = originalPage.layoutId;
        updatedPage.layoutId = updatedPage.lastArticleLayoutId || 'classic-article';
        if (!updatedPage.paragraphs || updatedPage.paragraphs.length === 0) {
          updatedPage.paragraphs = [{ id: `p-${Date.now()}`, en: '', zh: '' }];
        }
      } else {
        updatedPage.lastArticleLayoutId = originalPage.layoutId;
        updatedPage.layoutId = updatedPage.lastCoverLayoutId || 'classic-cover';
      }
    } else {
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
    
    const changedFontFields: Array<keyof PageData> = fontFields.filter(field => originalPage[field] !== updatedPage[field]);
    
    if (changedFontFields.length > 0) {
      setPages(prev => prev.map(page => {
        const updatedPageData: PageData = { ...page };
        if (page.id === updatedPage.id) {
           Object.assign(updatedPageData, updatedPage);
        }
        changedFontFields.forEach(field => {
          // @ts-ignore
          updatedPageData[field] = updatedPage[field];
        });
        return updatedPageData;
      }));
    } else {
      setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    }
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
      "Are you sure you want to delete this page?",
      () => {
        setPages(prev => prev.filter(p => p.id !== id));
        setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
      }
    );
  };

  const handleClearAll = () => {
    confirm(
      "Reset Project",
      "Are you sure you want to clear all pages?",
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
      }
    );
  };

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

  const handleImportProject = (file: File) => {
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
        
        alert("Import Success", "Project data has been loaded successfully.");
      } catch (err) {
        console.error("Import failed:", err);
        alert("Import Error", "Failed to import project. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  return {
    pages,
    setPages,
    currentPageIndex,
    setCurrentPageIndex,
    currentPage: pages[currentPageIndex],
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
  };
}
