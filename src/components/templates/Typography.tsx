import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

export default function Typography({ page }: TemplateProps) {
  return (
    <div className="w-full h-full bg-slate-950 p-12 flex flex-col justify-between relative overflow-hidden font-sans text-white">
      {/* Subtle Grain/Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Top Navigation */}
      <div className="flex justify-between items-start z-10 border-b border-white/20 pb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Edition // 2025</span>
        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
          <span>Vision</span>
          <span>Statement</span>
          <span>Archive</span>
        </div>
      </div>

      {/* Massive Typographic Graphic Section */}
      <div className="flex-1 flex flex-col justify-center py-12 space-y-8 z-10 overflow-hidden">
        <div className="w-full">
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={110}
            lineHeight={0.85}
            maxLines={6}
            fontFamily={page.titleEnFont || "'Inter', sans-serif"}
            className="font-black uppercase tracking-[-0.05em] break-words"
          />
        </div>
        
        <div className="h-px w-full bg-gradient-to-r from-[#264376] to-transparent opacity-50" />
        
        <div className="w-full">
          <AutoFitHeadline
            as="h2"
            text={page.titleZh}
            maxSize={64}
            lineHeight={1.1}
            maxLines={3}
            fontFamily={page.titleZhFont || "'Noto Serif SC', serif"}
            className="font-black tracking-tighter text-[#264376]"
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-12 z-10 pt-12 border-t border-white/20">
        <div className="space-y-4">
          <span className="inline-block bg-white text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
            Author_Credit
          </span>
          <p 
            className="text-lg font-bold uppercase tracking-tight text-white/90"
            style={{ fontFamily: page.bylineFont || "'Inter', sans-serif" }}
          >
            {page.byline}
          </p>
        </div>

        <div className="space-y-4 flex flex-col justify-between">
          {(page.quoteEn || page.quoteZh) && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#264376]">Abstract_Context</span>
              <p className="text-xs font-medium leading-relaxed text-white/60 line-clamp-3">
                {page.quoteEn || page.quoteZh}
              </p>
            </div>
          )}
          <div className="flex justify-between items-end">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/30">MagaEditor Pro v1.5</span>
          </div>
        </div>
      </div>

      {/* Vertical Side Text */}
      <div className="absolute right-[-40px] top-1/2 transform -rotate-90 translate-y-[-50%] pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-[1em] text-white/10 whitespace-nowrap">
          TYPOGRAPHY // FOCUS // SYSTEM
        </span>
      </div>
    </div>
  );
}

interface TemplateProps {
  page: PageData;
}
