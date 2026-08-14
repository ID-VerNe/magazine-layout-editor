import React, { memo, useCallback } from 'react';
import Preview from '../Preview';
import { PageData, PageSize } from '../../types';
import { ErrorBoundary } from '../ErrorBoundary';

interface PagePreviewItemProps {
  page: PageData;
  idx: number;
  totalPages: number;
  isActive: boolean;
  pageSize: PageSize;
  onPageOverflowChange: (pageId: string, isOverflowing: boolean) => void;
}

const PagePreviewItem = memo(({
  page,
  idx,
  totalPages,
  isActive,
  pageSize,
  onPageOverflowChange,
}: PagePreviewItemProps) => {
  const handleOverflow = useCallback((isOverflowing: boolean) => {
    onPageOverflowChange(page.id, isOverflowing);
  }, [page.id, onPageOverflowChange]);

  return (
    <div 
      data-page-id={page.id}
      className={`magazine-page-container ${isActive ? 'block' : 'hidden'} shadow-2xl shadow-slate-300/50`}
    >
      <ErrorBoundary fallbackTitle={`Page ${idx + 1} Render Error`}>
        <Preview 
          page={page} 
          pageIndex={idx} 
          totalPages={totalPages} 
          pageSize={pageSize} 
          onOverflowChange={handleOverflow}
        />
      </ErrorBoundary>
    </div>
  );
});
PagePreviewItem.displayName = 'PagePreviewItem';

interface PreviewAreaProps {
  pages: PageData[];
  currentPageIndex: number;
  previewZoom: number;
  previewRef: React.RefObject<HTMLDivElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  pageSize: PageSize;
  onOverflowChange: (pageId: string, isOverflowing: boolean) => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  pages,
  currentPageIndex,
  previewZoom,
  previewRef,
  previewContainerRef,
  pageSize,
  onOverflowChange
}) => {
  return (
    <div className="flex-1 overflow-auto p-12 no-scrollbar bg-neutral-200/50" ref={previewContainerRef}>
      <div 
        className="flex flex-col items-center gap-12 origin-top"
        ref={previewRef}
        style={{ transform: `scale(${previewZoom})` }}
      >
        {pages.map((page, idx) => (
          <PagePreviewItem
            key={page.id}
            page={page}
            idx={idx}
            totalPages={pages.length}
            isActive={idx === currentPageIndex}
            pageSize={pageSize}
            onPageOverflowChange={onOverflowChange}
          />
        ))}
      </div>
    </div>
  );
};

export default PreviewArea;
