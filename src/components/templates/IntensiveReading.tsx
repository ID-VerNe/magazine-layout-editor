import React from 'react';
import DOMPurify from 'dompurify';
import { PageData } from '../../types';
import { BylineDisplay, FooterDisplay, ImageFrame } from './SharedComponents';
import { formatMagazineText } from '../../utils/formatter';

const sanitize = (html: string) => DOMPurify.sanitize(html);

interface IntensiveReadingProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
}

export const IntensiveReading: React.FC<IntensiveReadingProps> = ({ page, pageIndex, totalPages }) => {
  const lineHeight = page.lineHeight || 1.6;
  const spacing = page.paragraphSpacing ?? 32;
  
  const imgPos = page.imagePosition || 'middle';
  const ratio = page.splitRatio || 64; 
  const balance = page.fontBalance || 0;
  const getThemeCSS = (theme: string = 'highlight') => {
    switch (theme) {
      case 'underline':
        return `
          text-decoration: underline; 
          text-decoration-color: #3b82f6; 
          text-decoration-thickness: 2px; 
          text-underline-offset: 4px; 
          background-color: transparent;
        `;
      case 'both':
        return `
          text-decoration: underline; 
          text-decoration-color: #3b82f6; 
          text-decoration-thickness: 2px; 
          text-underline-offset: 4px; 
          background-color: #eff6ff;
        `;
      case 'highlight':
      default:
        return `
          text-decoration: none;
          background-color: #eff6ff;
        `;
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden magazine-page ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`} style={{ backgroundColor: page.backgroundColor || '#FAF9F4' }}>
       <div className="flex-1 min-h-0 flex flex-col magazine-content-container overflow-hidden pb-10">
          <div className="pt-10 flex flex-col flex-1">
            {/* Header */}
            <div className="px-10 mb-2 flex-none">
                <h3 
                  className="font-bold text-lg mb-1 leading-tight whitespace-pre-wrap"
                  style={{ fontFamily: page.titleEnFont || "'Inter', sans-serif" }}
                >
                  {formatMagazineText(page.titleEn || "")}
                </h3>
                <div className="w-full h-[3px] bg-neutral-800 mb-4" />
                <div className="flex justify-between items-center text-neutral-500 mb-6">
                  <BylineDisplay 
                    byline={page.byline || ""}
                    fontFamily={page.bylineFont || "'Inter', sans-serif"}
                  />
                  <span className="font-bold not-italic whitespace-pre-wrap" style={{ fontFamily: page.footerFont || "'Inter', sans-serif" }}>{formatMagazineText(page.footerLeft || "")}</span>
                </div>
            </div>

            <div className="px-10 flex flex-col flex-1">
              {/* 1. MIDDLE POSITION IMAGE */}
              {imgPos === 'middle' && page.image && (
                <div style={{ marginBottom: `${spacing}px` }} className="flex-none">
                  <ImageFrame page={page} defaultHeight={300} />
                </div>
              )}

              {/* Dual Column Area */}
              <div 
                className="grid relative items-stretch flex-1" 
                style={{ 
                  gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
                  gap: '40px',
                }}>
                <div 
                  className="prose max-w-none"
                  style={{ 
                    fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                    lineHeight: lineHeight,
                    fontSize: `${16.5 - (balance * 0.5)}px`
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitize(page.leftContent || '') }}
                />

                <div
                  className="border-l pl-10 border-neutral-200 prose max-w-none"
                  style={{
                    fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                    lineHeight: lineHeight,
                    fontSize: `${14 + (balance * 0.5)}px`
                  }}
                >
                  {(page.annotations || []).map((ann) => (
                    <div key={ann.id} className="annotation-block">
                      <div className="annotation-label">
                        {!page.hideAnnotationSeq && <span className="annotation-seq">[{ann.seq}]</span>} <span className="annotation-word" style={ann.fontSize ? { fontSize: ann.fontSize } : undefined}>{ann.text}</span>
                      </div>
                      <div className="annotation-content" dangerouslySetInnerHTML={{ __html: sanitize(ann.comment || '') }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. UPON FOOTER IMAGE */}
              {imgPos === 'bottom' && page.image && (
                <div className="mt-auto pt-4 flex-none">
                  <ImageFrame page={page} defaultHeight={300} />
                </div>
              )}
            </div>
          </div>
       </div>

       <div className="flex-none">
          <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />
          {imgPos === 'absolute-bottom' && page.image && (
            <div className="w-full">
              <ImageFrame page={page} defaultHeight={300} />
            </div>
          )}
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
         .magazine-page mark[data-annotation-id] {
           ${getThemeCSS(page.annotationTheme)}
           position: relative;
           color: inherit;
         }
         ${!page.hideAnnotationSeq ? `
         .magazine-page mark[data-annotation-id]::after {
           content: "[" attr(data-seq) "]";
           vertical-align: super;
           font-size: 0.75em;
           color: inherit;
           margin-left: 2px;
           font-weight: bold;
         }
         ` : ''}
       `}} />
    </div>
  );
};
