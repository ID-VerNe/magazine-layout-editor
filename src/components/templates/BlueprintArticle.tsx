import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { formatMagazineText } from '../../utils/formatter';
import { ImageFrame, FooterDisplay } from './SharedComponents';

interface TemplateProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
}

export default function BlueprintArticle({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;

  return (
    <div className="w-full h-full relative font-mono text-slate-800 overflow-hidden flex flex-col" style={{ backgroundColor: page.backgroundColor || '#FAF9F4' }}>
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)',
             backgroundSize: '20px 20px',
             opacity: 0.15
           }} 
      />

      <div className="flex-1 flex flex-col relative z-10 magazine-content-container overflow-hidden pb-10">
        <div className="pt-10 flex flex-col flex-1">
          {/* Header Section */}
          <div className="px-10 border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end text-slate-900">
            <div className="space-y-2 max-w-[70%]">
              <span className="inline-block text-[10px] font-bold bg-[#ff6600] text-white px-2 py-0.5 shadow-sm uppercase">Technical_Spec // bilingual</span>
              <AutoFitHeadline
                as="h1"
                text={page.titleEn || ""}
                maxSize={24}
                lineHeight={1.05}
                maxLines={2}
                minSize={8}
                fontFamily={page.titleEnFont || "ui-monospace, monospace"}
                className="font-black uppercase tracking-tighter text-slate-900"
              />
            </div>
            <div className="text-right text-[9px] font-black whitespace-pre-wrap">
              <div>DOC_REF: GT-ART-{page.id.substring(0,6).toUpperCase()}</div>
              <div className="text-slate-500 mt-1 uppercase">Authorized: {formatMagazineText(page.byline?.split('|')[0] || 'UNKNOWN')}</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="px-10 flex-1 flex flex-col gap-10">
            {page.image && <ImageFrame page={page} defaultHeight={300} />}

            <div className="flex flex-col">
              {page.paragraphs?.map((p, index) => {
                const isLast = index === (page.paragraphs?.length || 0) - 1;
                const spacing = page.paragraphSpacing ?? 32;
                const isFirst = index === 0;

                return (
                  <div 
                    key={p.id} 
                    className="grid grid-cols-[55fr_45fr] gap-10 relative"
                    style={{ paddingBottom: isLast ? 0 : `${spacing}px` }}
                  >
                    {/* English Side */}
                    <div className={`space-y-2 border-l-${isFirst ? '4' : '[1px]'} ${isFirst ? 'border-[#ff6600]' : 'border-slate-300'} pl-6 py-1`}>
                      <span className={`text-[8px] font-black ${isFirst ? 'text-[#ff6600]' : 'text-slate-400'} block mb-1 tracking-widest uppercase`}>
                        Part_{index + 1}.en
                      </span>
                      <p 
                        className="text-[14px] text-justify text-slate-900 leading-relaxed whitespace-pre-wrap"
                        style={{ 
                          lineHeight: lineHeight,
                          fontFamily: page.paragraphEnFont || "serif"
                        }}
                      >
                        {formatMagazineText(p.en)}
                      </p>
                    </div>

                    {/* Chinese Side */}
                    <div className="space-y-2 py-1 pl-4">
                      <span className="text-[8px] font-black text-slate-400 block mb-1 tracking-widest uppercase">
                        Part_{index + 1}.zh
                      </span>
                      <p 
                        className="text-[14px] text-slate-700 font-medium text-justify whitespace-pre-wrap"
                        style={{ 
                          lineHeight: lineHeight,
                          fontFamily: page.paragraphZhFont || "'Noto Serif SC', 'Songti SC', serif" 
                        }}
                      >
                        {formatMagazineText(p.zh)}
                      </p>
                    </div>

                    <div className="absolute top-4 left-[55%] w-10 h-px border-t border-dashed border-slate-300 opacity-60 -translate-x-1/2" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />

      {/* Side Ruler Decoration */}
      <div className="absolute right-2 top-1/4 h-64 flex flex-col justify-between text-[7px] text-slate-300 pointer-events-none opacity-50">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <span>—</span>
            <span>{80 - i * 10}mm</span>
          </div>
        ))}
      </div>
    </div>
  );
}
