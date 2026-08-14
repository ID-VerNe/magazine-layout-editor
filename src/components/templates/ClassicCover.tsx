import React from 'react';
import { TemplateProps } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { ImageFrame, BylineDisplay, FooterDisplay, CoverBadgeLogo } from './SharedComponents';
import { formatMagazineText } from '../../utils/formatter';

export default function ClassicCover({ page, pageIndex, totalPages }: TemplateProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        {page.image ? (
          <ImageFrame page={page} defaultHeight={500} />
        ) : (
          <div className="pt-20 px-10 relative">
            <CoverBadgeLogo page={page} />
          </div>
        )}

        <div className={`px-10 flex-1 ${page.image ? 'py-10' : 'pb-10 pt-4'}`}>
          <div className="space-y-6">
            <AutoFitHeadline
              as="h1"
              text={page.titleEn || ""}
              maxSize={34}
              lineHeight={1.15}
              maxLines={3}
              fontFamily={page.titleEnFont || "'Inter', sans-serif"}
              className="font-bold text-[#222] max-w-[90%]"
            />
            <AutoFitHeadline
              as="h2"
              text={page.titleZh || ""}
              maxSize={52}
              lineHeight={1.1}
              maxLines={3}
              fontFamily={page.titleZhFont || "'Crimson Pro', serif"}
              className="font-black text-[#1a1a1a] tracking-tight"
            />
            
            <div className="flex items-center gap-3 pt-4">
              <span className="text-neutral-300 text-3xl">•</span>
              <BylineDisplay 
                byline={page.byline}
                fontFamily={page.bylineFont || "'Inter', sans-serif"}
                className="text-xl text-neutral-500"
              />
            </div>

            {(page.quoteEn || page.quoteZh) && (
              <div className="mt-10 pl-8 border-l-8 border-slate-200 space-y-4 py-2">
                {page.quoteEn && (
                  <p 
                    className="text-xl text-neutral-600 italic leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      fontFamily: page.quoteEnFont || "'Inter', sans-serif",
                    }}
                  >
                    {formatMagazineText(page.quoteEn)}
                  </p>
                )}
                {page.quoteZh && (
                  <p 
                    className="text-2xl text-neutral-500 font-light leading-snug whitespace-pre-wrap"
                    style={{ 
                      fontFamily: page.quoteZhFont || "'Crimson Pro', serif",
                    }}
                  >
                    {formatMagazineText(page.quoteZh)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />
    </div>
  );
}
