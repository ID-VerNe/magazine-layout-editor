import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

interface TemplateProps {
  page: PageData;
}

export default function Blueprint({ page }: TemplateProps) {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: 400 };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  return (
    <div className="w-full h-full bg-[#f4f4f4] p-10 border-[20px] border-white relative font-mono text-slate-700 overflow-hidden">
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-px h-full bg-slate-200" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200" />
        <div className="absolute top-10 left-10 text-slate-300 text-xl">+</div>
        <div className="absolute top-10 right-10 text-slate-300 text-xl">+</div>
        <div className="absolute bottom-10 left-10 text-slate-300 text-xl">+</div>
        <div className="absolute bottom-10 right-10 text-slate-300 text-xl">+</div>
      </div>

      {/* Top Metadata Section */}
      <div className="relative z-10 flex justify-between border-b border-slate-800 pb-2 mb-10 text-[10px] font-bold">
        <div className="flex gap-8">
          <span>DOC_ID: {page.id.substring(0, 8).toUpperCase()}</span>
          <span>REVISION: v1.05</span>
        </div>
        <div className="flex gap-8">
          <span className="bg-slate-800 text-white px-2">CLASSIFIED: PUBLIC</span>
          <span>EXT_REF: GT_SPEC_01</span>
        </div>
      </div>

      {/* Main Image with Engineering Frame */}
      <div className="relative z-10 border-2 border-dashed border-slate-400 p-2 mb-10 group bg-white shadow-xl">
        <div className="relative overflow-hidden h-[450px] bg-slate-900">
          {page.image && (
            <img 
              src={page.image} 
              className="w-full h-full object-cover grayscale contrast-[1.2] brightness-[1.1] mix-blend-screen opacity-90" 
              style={{
                transform: `scale(${config.scale})`,
                objectPosition: `${posX}% ${posY}%`,
                filter: 'grayscale(100%) contrast(120%) brightness(110%) sepia(30%) hue-rotate(180deg)'
              }}
            />
          )}
          {/* Scanning Lines Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
        </div>
        <div className="absolute -bottom-3 -right-3 bg-slate-900 text-white text-[10px] px-3 py-1 font-black tracking-tighter">
          REF_IMG // {page.id.substring(0,6).toUpperCase()}
        </div>
      </div>

      {/* Headline & Content */}
      <div className="relative z-10 space-y-6 font-mono">
        <div className="space-y-4">
          <div className="inline-block bg-[#ff6600] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm">
            {page.byline || 'PRIMARY SUBJECT'}
          </div>
          
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={44}
            lineHeight={1.0}
            maxLines={2}
            fontFamily={page.titleEnFont || "ui-monospace, monospace"}
            className="font-black uppercase tracking-tighter border-l-8 border-[#ff6600] pl-6 py-1 text-slate-900"
          />

          <div className="border-t border-slate-300 pt-4">
            <AutoFitHeadline
              as="h2"
              text={`// ${page.titleZh}`}
              maxSize={22}
              lineHeight={1.2}
              maxLines={2}
              fontFamily={page.titleZhFont || "ui-monospace, monospace"}
              className="font-black text-slate-600 tracking-tight"
            />
          </div>
        </div>

        {/* Technical Quote / Notes Section */}
        {(page.quoteEn || page.quoteZh) && (
          <div className="pt-6 border-t-2 border-dashed border-slate-300 space-y-3">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff6600]" />
              Technical_Notes / Reference_Quote
            </div>
            <div className="space-y-2 pl-4">
              {page.quoteEn && (
                <p 
                  className="text-xs italic font-medium leading-relaxed text-slate-500 max-w-xl"
                  style={{ fontFamily: page.quoteEnFont }}
                >
                  &gt; {page.quoteEn}
                </p>
              )}
              {page.quoteZh && (
                <p 
                  className="text-sm font-bold leading-relaxed text-slate-600 max-w-xl"
                  style={{ fontFamily: page.quoteZhFont }}
                >
                  {page.quoteZh}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Technical Stamp Decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <div className="border-4 border-slate-900 p-2 font-black text-4xl rotate-[-15deg] uppercase">
            Approved
          </div>
        </div>
      </div>

      {/* Side Ruler Decoration */}
      <div className="absolute right-4 top-1/4 h-64 flex flex-col justify-between text-[8px] text-slate-300 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span>—</span>
            <span>{100 - i * 10}mm</span>
          </div>
        ))}
      </div>
    </div>
  );
}
