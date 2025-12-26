import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

interface TemplateProps {
  page: PageData;
}

const ImageFrame: React.FC<{ page: PageData, defaultHeight: number }> = ({ page, defaultHeight }) => {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: defaultHeight };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  return (
    <div className="relative bg-white border-2 border-dashed border-slate-400 p-1.5 shadow-sm">
      <div 
        className="relative overflow-hidden bg-slate-100" 
        style={{ height: `${config.height}px` }}
      >
        {page.image && (
          <img 
            src={page.image} 
            className="w-full h-full object-cover" 
            style={{
              transform: `scale(${config.scale})`,
              objectPosition: `${posX}% ${posY}%`,
              filter: 'grayscale(100%) contrast(120%)'
            }}
          />
        )}
        {/* Engineering Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-px h-full bg-slate-800/10" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800/10" />
        </div>
      </div>
      
      {/* L-Shaped Corner Marks */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-slate-800 pointer-events-none" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-slate-800 pointer-events-none" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-slate-800 pointer-events-none" />

      {/* Label */}
      <div className="absolute -bottom-3 right-4 bg-slate-900 text-white font-mono text-[8px] px-2 py-0.5 tracking-tighter">
        REF_IMG // {page.id.substring(0,6).toUpperCase()}
      </div>
    </div>
  );
};

export default function BlueprintArticle({ page }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;

  return (
    <div className="w-full h-full bg-[#f4f4f4] relative font-mono text-slate-800 overflow-hidden p-10 flex flex-col">
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)',
             backgroundSize: '20px 20px',
             opacity: 0.15
           }} 
      />

      {/* Header Section */}
      <div className="relative z-10 border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end text-slate-900">
        <div className="space-y-2 max-w-[70%]">
          <span className="inline-block text-[10px] font-bold bg-[#ff6600] text-white px-2 py-0.5 shadow-sm uppercase">Technical_Spec // bilingual</span>
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={24}
            lineHeight={1.05}
            maxLines={2}
            minSize={8}
            fontFamily={page.titleEnFont || "ui-monospace, monospace"}
            className="font-black uppercase tracking-tighter text-slate-900"
          />
        </div>
        <div className="text-right text-[9px] font-black">
          <div>DOC_REF: GT-ART-{page.id.substring(0,6).toUpperCase()}</div>
          <div className="text-slate-500 mt-1 uppercase">Authorized: {page.byline?.split('|')[0] || 'UNKNOWN'}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col gap-10">
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
                    className="text-[14px] text-justify font-serif text-slate-900 leading-relaxed"
                    style={{ lineHeight: lineHeight }}
                  >
                    {p.en}
                  </p>
                </div>

                {/* Chinese Side - Noto Serif SC for printed look */}
                <div className="space-y-2 py-1 pl-4">
                  <span className="text-[8px] font-black text-slate-400 block mb-1 tracking-widest uppercase">
                    Part_{index + 1}.zh
                  </span>
                  <p 
                    className="text-[14px] text-slate-700 font-medium text-justify"
                    style={{ 
                      lineHeight: lineHeight,
                      fontFamily: "'Noto Serif SC', 'Songti SC', serif" 
                    }}
                  >
                    {p.zh}
                  </p>
                </div>

                {/* Connector Line decoration - Positioned at 55% */}
                <div 
                  className="absolute top-4 left-[55%] w-10 h-px border-t border-dashed border-slate-300 opacity-60 -translate-x-1/2" 
                />
              </div>
            );
          })}
        </div>
      </div>

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