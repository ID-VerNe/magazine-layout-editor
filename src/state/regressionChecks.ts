import { PageData } from '../types';

export function assertProjectStateConsistency(pages: PageData[], currentPageId: string | null) {
  if (pages.length === 0) {
    throw new Error('[state-check] pages cannot be empty');
  }
  if (!currentPageId || !pages.some(page => page.id === currentPageId)) {
    throw new Error(`[state-check] currentPageId is invalid: ${currentPageId}`);
  }
}

export function checkInheritedAnnotationMode(source: PageData, created: PageData) {
  return source.hideAnnotationSeq === created.hideAnnotationSeq
    && source.annotationTheme === created.annotationTheme
    && source.annotationStyle === created.annotationStyle;
}

export function checkExportPageName(expectedPageNumber: number, fileName: string) {
  return fileName === `magazine-page-${expectedPageNumber}.png`;
}
