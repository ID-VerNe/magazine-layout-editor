import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

interface TemplateProps {
  page: PageData;
}

export default function Tabloid({ page }: TemplateProps) {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: 500 };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  // Extract magazine name from byline (content after '|')
  const magName = page.byline.includes('|') 
    ? page.byline.split('|')[1].trim().toUpperCase()
    : 'MAGA NEWS';

  return (
    <div className="w-full h-full bg-[#fdfdfd] relative overflow-hidden flex flex-col font-sans">
      {/* Red Header Bar */}
      <div className="bg-[#e21f26] text-white p-4 flex justify-between items-center relative z-20">
        <span className="font-black text-4xl italic tracking-tighter transform skew-x-[-10deg] leading-none">{magName}</span>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest leading-none">Exclusive Edition</div>
          <div className="text-xl font-black italic tracking-tighter">BOOM!</div>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative z-10 border-b-8 border-black">
        <div className="relative h-[480px] overflow-hidden bg-slate-200">
          {page.image && (
            <img 
              src={page.image} 
              className="w-full h-full object-cover grayscale contrast-125" 
              style={{
                transform: `scale(${config.scale})`,
                objectPosition: `${posX}% ${posY}%`,
              }}
            />
          )}
          <div className="absolute top-6 left-[-10px] bg-[#e21f26] text-white px-8 py-2 font-black text-2xl uppercase tracking-tighter transform rotate-[-5deg] shadow-xl border-2 border-white">
            Breaking News
          </div>
        </div>
      </div>

      {/* Exaggerated Typography Section */}
      <div className="flex-1 p-8 bg-white relative flex flex-col justify-center overflow-hidden">
        <div className="relative z-10 space-y-6">
          {/* Refactored Headline with integrated background to prevent overflow */}
          <div className="inline-block bg-yellow-300 transform rotate-[-1.5deg] px-4 py-2 shadow-sm max-w-full">
            <AutoFitHeadline
              as="h1"
              text={page.titleEn}
              maxSize={42}
              lineHeight={0.95}
              maxLines={4}
              fontFamily={page.titleEnFont || "Arial Black, sans-serif"}
              className="font-black uppercase tracking-tighter text-black italic"
            />
          </div>

          <div className="transform rotate-[1deg] px-2">
            <AutoFitHeadline
              as="h2"
              text={page.titleZh}
              maxSize={36}
              lineHeight={1.2}
              maxLines={3}
              fontFamily={page.titleZhFont || "SimHei, sans-serif"}
              className="font-black tracking-tighter text-[#e21f26] uppercase"
            />
          </div>
        </div>

        {/* Byline */}
        <div className="mt-8 flex items-center gap-3 relative z-10">
          <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest">Reporter</span>
          <span className="text-sm font-bold uppercase border-b-2 border-black tracking-tight text-slate-900">{page.byline}</span>
        </div>

        {/* Red Circle Callout */}
        <div className="absolute bottom-6 right-6 w-24 h-24 border-4 border-[#e21f26] rounded-full flex items-center justify-center transform rotate-[15deg] opacity-80 z-0">
          <span className="text-[#e21f26] font-black text-center leading-none text-xs uppercase tracking-tighter">
            Shocking<br/>Truth!
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-black flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50">
        <span>© News Group Newspapers Ltd</span>
        <div className="flex gap-4">
          <span>Registered: London 1969</span>
          <span>Verified Archive</span>
        </div>
      </div>
    </div>
  );
}
