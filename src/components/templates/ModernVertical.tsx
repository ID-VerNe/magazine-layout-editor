import React from 'react';
import { PageData } from '../../types';
import { ImageFrame, BylineDisplay, FooterDisplay } from './SharedComponents';
import { Quote } from 'lucide-react';
import { formatMagazineText } from '../../utils/formatter';

interface TemplateProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
}

export default function ModernVertical({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || '#367237';
  
  const imgPos = page.imagePosition || 'middle';

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: page.backgroundColor || '#FAF9F4' }}>
       <div className="flex-1 min-h-0 flex flex-col magazine-content-container overflow-hidden pb-10">
          <div className="pt-10 flex flex-col flex-1">
            <div className="px-10 mb-2">
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
                <div style={{ marginBottom: `${spacing}px` }}>
                  <ImageFrame page={page} defaultHeight={300} />
                </div>
              )}

              <div className="flex flex-col">
                {page.paragraphs?.map((p, index) => {
                  const isLast = index === (page.paragraphs?.length || 0) - 1;
                  const showBottomSpacing = !isLast || (isLast && imgPos === 'bottom');
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`relative transition-all duration-300 ${
                        p.emphasis ? 'p-5 mb-4 rounded-lg border-l-4 shadow-sm' : ''
                      }`}
                      style={{ 
                        marginBottom: showBottomSpacing ? `${spacing}px` : 0,
                        backgroundColor: p.emphasis ? `${accentColor}10` : 'transparent', 
                        borderLeftColor: p.emphasis ? accentColor : 'transparent'
                      }}
                    >
                      {p.emphasis && (
                        <div className="absolute top-2 right-3" style={{ color: `${accentColor}0D` }}>
                          <Quote size={20} />
                        </div>
                      )}
                      <p 
                        className={`text-[17px] text-neutral-800 text-justify whitespace-pre-wrap ${p.emphasis ? 'font-medium italic leading-relaxed' : ''}`}
                        style={{ 
                          fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                          lineHeight: lineHeight
                        }}
                      >
                        {formatMagazineText(p.en || "")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 2. UPON FOOTER POSITION */}
              {imgPos === 'bottom' && page.image && (
                <div className="mt-auto pt-4">
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
    </div>
  );
}