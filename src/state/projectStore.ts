import { CustomFont, PageData, PageSize, PageType } from '../types';
import { createPageFromTemplate } from './pageFactory';
import { checkInheritedAnnotationMode } from './regressionChecks';

export interface ProjectEditorState {
  pages: PageData[];
  currentPageId: string | null;
  customFonts: CustomFont[];
  pageSize: PageSize;
  isLoaded: boolean;
  dirty: boolean;
  exportQueue: string[];
  version: number;
}

type LoadPayload = {
  pages: PageData[];
  customFonts?: CustomFont[];
  pageSize?: PageSize;
};

type AddPagePayload = {
  type: PageType;
  sourcePageId?: string | null;
  templateId?: string | null;
};

type UpdatePagePayload = {
  pageId: string;
  updater: (page: PageData) => PageData;
};

export type ProjectAction =
  | { type: 'LOAD_PROJECT'; payload: LoadPayload }
  | { type: 'SET_CURRENT_PAGE'; payload: { pageId: string } }
  | { type: 'SET_CUSTOM_FONTS'; payload: { customFonts: CustomFont[] } }
  | { type: 'SET_PAGE_SIZE'; payload: { pageSize: PageSize } }
  | { type: 'UPDATE_PAGE'; payload: UpdatePagePayload }
  | { type: 'ADD_PAGE'; payload: AddPagePayload }
  | { type: 'REMOVE_PAGE'; payload: { pageId: string } }
  | { type: 'CLEAR_ALL' }
  | { type: 'QUEUE_EXPORT'; payload: { pageIds: string[] } }
  | { type: 'CLEAR_EXPORT_QUEUE' };

export const createInitialProjectState = (): ProjectEditorState => {
  const initialPage = createPageFromTemplate({ templateId: 'classic-cover' });
  return {
    pages: [initialPage],
    currentPageId: initialPage.id,
    customFonts: [],
    pageSize: 'A4',
    isLoaded: false,
    dirty: false,
    exportQueue: [],
    version: 1,
  };
};

const findPage = (pages: PageData[], pageId?: string | null) => {
  if (!pageId) return null;
  return pages.find(page => page.id === pageId) || null;
};

const withInvariant = (state: ProjectEditorState, action: string): ProjectEditorState => {
  if (state.pages.length === 0) {
    const fallback = createPageFromTemplate({ templateId: 'classic-cover' });
    if (import.meta.env.DEV) {
      console.warn(`[projectStore] ${action}: pages empty; creating fallback page`);
    }
    return {
      ...state,
      pages: [fallback],
      currentPageId: fallback.id,
      version: state.version + 1,
    };
  }

  const hasCurrent = state.currentPageId && state.pages.some(page => page.id === state.currentPageId);
  if (!hasCurrent) {
    const fallbackId = state.pages[0].id;
    if (import.meta.env.DEV) {
      console.warn(`[projectStore] ${action}: currentPageId missing; rewiring to`, fallbackId);
    }
    return {
      ...state,
      currentPageId: fallbackId,
      version: state.version + 1,
    };
  }

  return state;
};

export function projectReducer(state: ProjectEditorState, action: ProjectAction): ProjectEditorState {
  switch (action.type) {
    case 'LOAD_PROJECT': {
      const pages = action.payload.pages.length > 0
        ? action.payload.pages
        : [createPageFromTemplate({ templateId: 'classic-cover' })];
      const next: ProjectEditorState = {
        ...state,
        pages,
        currentPageId: pages[0].id,
        customFonts: action.payload.customFonts || [],
        pageSize: action.payload.pageSize || 'A4',
        isLoaded: true,
        dirty: false,
        version: state.version + 1,
      };
      return withInvariant(next, action.type);
    }

    case 'SET_CURRENT_PAGE': {
      if (!state.pages.some(page => page.id === action.payload.pageId)) {
        if (import.meta.env.DEV) {
          console.warn('[projectStore] SET_CURRENT_PAGE skipped: page not found', action.payload.pageId);
        }
        return state;
      }
      return {
        ...state,
        currentPageId: action.payload.pageId,
      };
    }

    case 'SET_CUSTOM_FONTS': {
      return {
        ...state,
        customFonts: action.payload.customFonts,
        dirty: true,
        version: state.version + 1,
      };
    }

    case 'SET_PAGE_SIZE': {
      return {
        ...state,
        pageSize: action.payload.pageSize,
        dirty: true,
        version: state.version + 1,
      };
    }

    case 'UPDATE_PAGE': {
      let found = false;
      const pages = state.pages.map(page => {
        if (page.id !== action.payload.pageId) return page;
        found = true;
        return action.payload.updater(page);
      });

      if (!found) {
        if (import.meta.env.DEV) {
          console.warn('[projectStore] UPDATE_PAGE skipped: page not found', action.payload.pageId);
        }
        return state;
      }

      return withInvariant({
        ...state,
        pages,
        dirty: true,
        version: state.version + 1,
      }, action.type);
    }

    case 'ADD_PAGE': {
      const sourcePage = findPage(state.pages, action.payload.sourcePageId) || findPage(state.pages, state.currentPageId);
      const page = createPageFromTemplate({
        type: action.payload.type,
        sourcePage: sourcePage || undefined,
        templateId: action.payload.templateId || (sourcePage?.type === action.payload.type ? sourcePage.layoutId : undefined),
      });

      if (import.meta.env.DEV && sourcePage?.layoutId === 'intensive-reading') {
        const inherited = checkInheritedAnnotationMode(sourcePage, page);
        if (!inherited) {
          console.warn('[add-page-check] annotation mode did not inherit from source page', {
            sourcePageId: sourcePage.id,
            newPageId: page.id,
          });
        }
      }

      const pages = [...state.pages, page];
      return withInvariant({
        ...state,
        pages,
        currentPageId: page.id,
        dirty: true,
        version: state.version + 1,
      }, action.type);
    }

    case 'REMOVE_PAGE': {
      const pages = state.pages.filter(page => page.id !== action.payload.pageId);
      const nextState: ProjectEditorState = {
        ...state,
        pages,
        dirty: true,
        version: state.version + 1,
      };

      if (state.currentPageId === action.payload.pageId) {
        nextState.currentPageId = pages[0]?.id || null;
      }

      return withInvariant(nextState, action.type);
    }

    case 'CLEAR_ALL': {
      const resetPage = createPageFromTemplate({ templateId: 'classic-cover' });
      return {
        ...state,
        pages: [resetPage],
        currentPageId: resetPage.id,
        pageSize: 'A4',
        exportQueue: [],
        dirty: true,
        version: state.version + 1,
      };
    }

    case 'QUEUE_EXPORT': {
      return {
        ...state,
        exportQueue: action.payload.pageIds,
      };
    }

    case 'CLEAR_EXPORT_QUEUE': {
      return {
        ...state,
        exportQueue: [],
      };
    }

    default:
      return state;
  }
}

export function getCurrentPage(pages: PageData[], currentPageId: string | null): PageData {
  return findPage(pages, currentPageId) || pages[0];
}

export function getCurrentPageIndex(pages: PageData[], currentPageId: string | null): number {
  const idx = pages.findIndex(page => page.id === currentPageId);
  return idx === -1 ? 0 : idx;
}
