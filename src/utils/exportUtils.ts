import { toPng } from 'html-to-image';
import { PageData } from '../types';
import { checkExportPageName } from '../state/regressionChecks';

export interface ExportPagesOptions {
  exportAll: boolean;
  pages: PageData[];
  currentPageId: string | null;
  previewRef: React.RefObject<HTMLDivElement | null>;
  previewZoom: number;
  setPreviewZoom: (zoom: number) => void;
}

export async function exportPagesAsPng({
  exportAll,
  pages,
  currentPageId,
  previewRef,
  previewZoom,
  setPreviewZoom,
}: ExportPagesOptions): Promise<void> {
  if (!previewRef.current) return;

  const prevZoom = previewZoom;
  setPreviewZoom(1);

  // Wait for font loading and zoom change to fully render
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font ready errors
    }
  }
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 200)));

  const pageIdsToExport = exportAll
    ? pages.map((page) => page.id)
    : currentPageId
    ? [currentPageId]
    : [];
  const pagePositions = new Map(pages.map((page, index) => [page.id, index + 1]));
  const containers = pageIdsToExport.map(
    (pageId) =>
      previewRef.current?.querySelector(
        `.magazine-page-container[data-page-id="${pageId}"]`
      ) as HTMLElement | null
  );
  const previousDisplay = new Map<HTMLElement, string>();

  containers.forEach((container) => {
    if (container) {
      previousDisplay.set(container, container.style.display);
      container.style.display = 'block';
    }
  });

  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 150)));

  for (let i = 0; i < pageIdsToExport.length; i++) {
    const pageId = pageIdsToExport[i];
    const container = containers[i];
    const targetElement = container?.querySelector('.magazine-page') as HTMLElement;
    if (!targetElement) {
      console.warn(`Skipping page export: element not found for ${pageId}`);
      continue;
    }
    const sourcePage = pages.find((page) => page.id === pageId);
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
        console.warn('[export-check] unexpected export filename', {
          pageId,
          pageNumber,
          file: link.download,
        });
      }
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(`Failed to export page ${pageNumber}:`, err);
    }
    if (exportAll) await new Promise((resolve) => setTimeout(resolve, 120));
  }

  containers.forEach((container) => {
    if (container) {
      container.style.display = previousDisplay.get(container) || '';
    }
  });

  setPreviewZoom(prevZoom);
}
