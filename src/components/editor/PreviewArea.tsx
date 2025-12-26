import React from 'react';
import Preview from '../Preview';
import { PageData } from '../../types';

interface PreviewAreaProps {
  pages: PageData[];
  currentPageIndex: number;
  previewZoom: number;
  previewRef: React.RefObject<HTMLDivElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  enforceA4: boolean;
  onOverflowChange: (pageId: string, isOverflowing: boolean) => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  pages,
  currentPageIndex,
  previewZoom,
  previewRef,
  previewContainerRef,
  enforceA4,
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
          <div 
            key={page.id} 
            className={`magazine-page-container ${idx === currentPageIndex ? 'block' : 'hidden'} shadow-2xl shadow-slate-300/50`}
          >
            <Preview 
              page={page} 
              pageIndex={idx} 
              totalPages={pages.length} 
              enforceA4={enforceA4} 
              onOverflowChange={(overflow) => onOverflowChange(page.id, overflow)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewArea;
