import React from 'react';
import { PageData } from '../../types';
import { ImageFrame, BylineDisplay, FooterDisplay } from './SharedComponents';
import { formatMagazineText } from '../../utils/formatter';

interface ArticleLayoutShellProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
  children: React.ReactNode;
  customHeader?: React.ReactNode;
  defaultImageHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ArticleLayoutShell: React.FC<ArticleLayoutShellProps> = ({
  page,
  pageIndex,
  totalPages,
  children,
  customHeader,
  defaultImageHeight = 300,
  className = '',
  style,
}) => {
  const spacing = page.paragraphSpacing ?? 32;
  const imgPos = page.imagePosition || 'middle';

  const defaultHeader = (
    <div className="px-10 mb-2 flex-none">
      <h3
        className="font-bold text-lg mb-1 leading-tight whitespace-pre-wrap"
        style={{ fontFamily: page.titleEnFont || "'Inter', sans-serif" }}
      >
        {formatMagazineText(page.titleEn || '')}
      </h3>
      <div className="w-full h-[3px] bg-neutral-800 mb-4" />
      <div className="flex justify-between items-center text-neutral-500 mb-6">
        <BylineDisplay
          byline={page.byline || ''}
          fontFamily={page.bylineFont || "'Inter', sans-serif"}
        />
        <span
          className="font-bold not-italic whitespace-pre-wrap"
          style={{ fontFamily: page.footerFont || "'Inter', sans-serif" }}
        >
          {formatMagazineText(page.footerLeft || '')}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ backgroundColor: page.backgroundColor || '#FAF9F4', ...style }}
    >
      <div className="flex-1 min-h-0 flex flex-col magazine-content-container overflow-hidden pb-10">
        <div className="pt-10 flex flex-col flex-1">
          {customHeader || defaultHeader}

          <div className="px-10 flex flex-col flex-1">
            {/* 1. Middle Position Image */}
            {imgPos === 'middle' && page.image && (
              <div style={{ marginBottom: `${spacing}px` }} className="flex-none">
                <ImageFrame page={page} defaultHeight={defaultImageHeight} />
              </div>
            )}

            {/* Main Content Area */}
            {children}

            {/* 2. Upon Footer Position Image */}
            {imgPos === 'bottom' && page.image && (
              <div className="mt-auto pt-4 flex-none">
                <ImageFrame page={page} defaultHeight={defaultImageHeight} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-none">
        <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />
        {imgPos === 'absolute-bottom' && page.image && (
          <div className="w-full">
            <ImageFrame page={page} defaultHeight={defaultImageHeight} />
          </div>
        )}
      </div>
    </div>
  );
};
