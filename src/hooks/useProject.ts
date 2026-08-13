import { useReducer, useEffect, useCallback } from 'react';
import { PageData, CustomFont, ProjectData, PageType, PageSize } from '../types';
import { getProject, saveProject } from '../utils/db';
import { toPng } from 'html-to-image';
import { useUI } from '../context/UIContext';
import { createPageFromTemplate, getTemplateSpec } from '../state/pageFactory';
import { createInitialProjectState, getCurrentPage, getCurrentPageIndex, projectReducer } from '../state/projectStore';
import { assertProjectStateConsistency } from '../state/regressionChecks';

export const registerFontInDOM = (family: string, dataUrl: string) => {
  if (document.getElementById(`style-${family}`)) return;
  const style = document.createElement('style');
  style.id = `style-${family}`;
  style.innerHTML = `
    @font-face {
      font-family: '${family}';
      src: url('${dataUrl}');
    }
  `;
  document.head.appendChild(style);
};

export function useProject(projectId: string | undefined, templateId: string | null) {
  const { alert, confirm } = useUI();
  const [state, dispatch] = useReducer(projectReducer, undefined, createInitialProjectState);

  const { pages, customFonts, pageSize, isLoaded, currentPageId } = state;
  const currentPageIndex = getCurrentPageIndex(pages, currentPageId);
  const currentPage = getCurrentPage(pages, currentPageId);

  useEffect(() => {
    if (!isLoaded || !import.meta.env.DEV) return;
    try {
      assertProjectStateConsistency(pages, currentPageId);
    } catch (error) {
      console.error(error);
    }
  }, [pages, currentPageId, isLoaded]);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      const savedData = await getProject(projectId);

      if (savedData) {
        const loadedFonts = savedData.customFonts || [];
        loadedFonts.forEach((font: CustomFont) => {
          if (font.dataUrl) registerFontInDOM(font.family, font.dataUrl);
        });

        dispatch({
          type: 'LOAD_PROJECT',
          payload: {
            pages: savedData.pages || [createPageFromTemplate({ templateId: 'classic-cover' })],
            customFonts: loadedFonts,
            pageSize: savedData.settings?.pageSize || 'A4',
          },
        });
        return;
      }

      const templateSpec = getTemplateSpec(templateId);
      const initialPage = createPageFromTemplate({
        templateId: templateSpec?.layoutId || templateId || 'classic-cover',
      });

      dispatch({
        type: 'LOAD_PROJECT',
        payload: {
          pages: [initialPage],
          customFonts: [],
          pageSize: 'A4',
        },
      });
    }

    loadData();
  }, [projectId, templateId]);

  const setCurrentPageId = useCallback((pageId: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId } });
  }, []);

  const setCurrentPageIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, pages.length - 1));
    const target = pages[clamped];
    if (target) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: target.id } });
    }
  }, [pages]);

  const updateCustomFonts = useCallback((update: CustomFont[] | ((prev: CustomFont[]) => CustomFont[])) => {
    const nextFonts = typeof update === 'function' ? update(customFonts) : update;
    nextFonts.forEach(font => {
      if (font.dataUrl) registerFontInDOM(font.family, font.dataUrl);
    });
    dispatch({ type: 'SET_CUSTOM_FONTS', payload: { customFonts: nextFonts } });
  }, [customFonts]);

  const setPageSize = useCallback((size: PageSize) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: { pageSize: size } });
  }, []);

  const saveToDB = useCallback(async (previewRef: React.RefObject<HTMLDivElement | null>, options?: { generateThumbnail?: boolean }) => {
    if (!projectId || !isLoaded) return;

    let thumbnail = null;
    if (previewRef.current && options?.generateThumbnail) {
      try {
        const pageEl = previewRef.current.querySelector('.magazine-page') as HTMLElement;
        if (pageEl) {
          thumbnail = await toPng(pageEl, {
            pixelRatio: 0.2,
            quality: 0.5,
            backgroundColor: pages[0]?.backgroundColor || '#FAF9F4',
          });
        }
      } catch (e) {
        console.error('Thumb failed', e);
      }
    }

    const projectState = {
      pages,
      customFonts,
      settings: { pageSize },
      lastEdited: new Date().toISOString(),
      title: pages[0]?.titleEn || 'Untitled Project'
    };

    await saveProject(projectId, projectState);

    const indexSaved = localStorage.getItem('magazine_recent_projects');
    let index = indexSaved ? JSON.parse(indexSaved) : [];

    const existingIdx = index.findIndex((p: any) => p.id === projectId);

    if (!thumbnail && existingIdx > -1) {
      thumbnail = index[existingIdx].thumbnail;
    }

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
  }, [pages, customFonts, pageSize, projectId, isLoaded]);

  const updatePage = useCallback((updatedPageInput: PageData) => {
    dispatch({
      type: 'UPDATE_PAGE',
      payload: {
        pageId: updatedPageInput.id,
        updater: (originalPage) => {
          const updatedPage: PageData = { ...updatedPageInput };

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

          const carryFields: Array<keyof PageData> = [
            'titleEnFont', 'titleZhFont', 'bylineFont', 'quoteEnFont', 'quoteZhFont',
            'footerFont', 'paragraphEnFont', 'paragraphZhFont', 'footnoteFont',
            'backgroundColor', 'accentColor', 'splitRatio', 'fontBalance',
            'footerSwap', 'footerRightType', 'footerLogo', 'footerLogoSize', 'footerRightX', 'footerRightY',
            'logoX', 'logoY', 'annotationTheme', 'annotationStyle', 'hideAnnotationSeq',
          ];

          const merged: PageData = { ...originalPage, ...updatedPage };
          carryFields.forEach(field => {
            if (updatedPage[field] !== undefined) {
              // @ts-ignore
              merged[field] = updatedPage[field];
            }
          });

          return merged;
        },
      },
    });
  }, []);

  const addPage = useCallback((type: PageType) => {
    dispatch({
      type: 'ADD_PAGE',
      payload: {
        type,
        sourcePageId: currentPageId,
      },
    });
  }, [currentPageId]);

  const removePage = useCallback((id: string) => {
    if (pages.length <= 1) {
      confirm(
        'Reset Project',
        'Are you sure you want to clear all pages?',
        () => dispatch({ type: 'CLEAR_ALL' }),
      );
      return;
    }

    confirm(
      'Delete Page',
      'Are you sure you want to delete this page?',
      () => {
        dispatch({ type: 'REMOVE_PAGE', payload: { pageId: id } });
      }
    );
  }, [pages.length, confirm]);

  const handleClearAll = useCallback(() => {
    confirm(
      'Reset Project',
      'Are you sure you want to clear all pages?',
      () => dispatch({ type: 'CLEAR_ALL' }),
    );
  }, [confirm]);

  const handleExportProject = useCallback(() => {
    setTimeout(() => {
      try {
        const project: ProjectData = {
          version: '1.0',
          pages,
          customFonts,
          settings: { pageSize }
        };
        const json = JSON.stringify(project);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `project-${new Date().toISOString().slice(0, 10)}.wdzmaga`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Export failed', e);
        alert('导出失败', '打包项目数据时出错。');
      }
    }, 100);
  }, [pages, customFonts, pageSize, alert]);

  const handleImportProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project: ProjectData = JSON.parse(event.target?.result as string);
        (project.customFonts || []).forEach(font => {
          if (font.dataUrl) registerFontInDOM(font.family, font.dataUrl);
        });

        dispatch({
          type: 'LOAD_PROJECT',
          payload: {
            pages: project.pages || [createPageFromTemplate({ templateId: 'classic-cover' })],
            customFonts: project.customFonts || [],
            pageSize: project.settings?.pageSize || 'A4',
          },
        });

        alert('导入成功', '项目数据及自定义字体已全部加载。');
      } catch (err) {
        console.error('Import failed:', err);
        alert('导入失败', '文件格式无效或已损坏。');
      }
    };
    reader.readAsText(file);
  }, [alert]);

  return {
    pages,
    setPages: (next: PageData[] | ((prev: PageData[]) => PageData[])) => {
      const resolved = typeof next === 'function' ? next(pages) : next;
      dispatch({
        type: 'LOAD_PROJECT',
        payload: {
          pages: resolved,
          customFonts,
          pageSize,
        },
      });
    },
    currentPageId,
    setCurrentPageId,
    currentPageIndex,
    setCurrentPageIndex,
    currentPage,
    customFonts,
    setCustomFonts: updateCustomFonts,
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
  };
}
