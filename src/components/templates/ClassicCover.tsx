import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { ImageFrame, BylineDisplay } from './SharedComponents';

interface TemplateProps {
  page: PageData;
}

export default function ClassicCover({ page }: TemplateProps) {
  return (
    <>
      {page.image ? (
            <ImageFrame page={page} defaultHeight={500} />
          ) : (
        <div className="pt-20 px-10 relative">
          {(page.featuredText || page.logo) && (
            <div 
              className="absolute top-12 right-10 flex items-center gap-2 z-10"
              style={{ 
                backgroundColor: page.featuredText ? (page.badgeColor || '#ccff33') : 'transparent',
                padding: page.featuredText ? '12px 12px' : '0px',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
                transform: 'rotate(12deg)',
                border: '2px dashed rgba(0,0,0,0.1)'
              }}
            >
               <div 
                className="flex items-center justify-center overflow-hidden mx-auto"
                style={{ 
                  width: 'auto', 
                  height: `${page.featuredText ? 24 : (page.logoSize || 32)}px`,
                }}
               >
                {page.logo ? (
                  <img src={page.logo} className="h-full w-auto object-contain" alt="Logo" />
                ) : (
                  <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-[10px]">M</div>
                )}
               </div>
               {page.featuredText && (
                 <span className="font-black text-[10px] uppercase leading-none mt-1 text-slate-900">{page.featuredText}</span>
               )}
            </div>
          )}
        </div>
      )}

      <div className={`px-10 flex-1 ${page.image ? 'py-10' : 'pb-10 pt-4'}`}>
        <div className="space-y-6">
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={34}
            lineHeight={1.15}
            maxLines={3}
            fontFamily={page.titleEnFont || "'Inter', sans-serif"}
            className="font-bold text-[#222] max-w-[90%]"
          />
          <AutoFitHeadline
            as="h2"
            text={page.titleZh}
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
                  className="text-xl text-neutral-600 italic leading-relaxed"
                  style={{ 
                    fontFamily: page.quoteEnFont || "'Inter', sans-serif",
                  }}
                >
                  "{page.quoteEn}"
                </p>
              )}
              {page.quoteZh && (
                <p 
                  className="text-2xl text-neutral-500 font-light leading-snug"
                  style={{ 
                    fontFamily: page.quoteZhFont || "'Crimson Pro', serif",
                  }}
                >
                  {page.quoteZh}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}