import React from 'react';
import { PageData } from '../../types';
import { ImageFrame, BylineDisplay } from './SharedComponents';

interface TemplateProps {
  page: PageData;
}

export default function ClassicArticle({ page }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;

  return (
    <div className="pt-10 pb-10">
       <div className="px-10 mb-2">
          <h3 
            className="font-bold text-lg mb-1 leading-tight"
            style={{ fontFamily: page.titleEnFont || "'Inter', sans-serif" }}
          >
            {page.titleEn}
          </h3>
          <div className="w-full h-[3px] bg-neutral-800 mb-4" />
          <div className="flex justify-between items-center text-neutral-500 mb-6">
            <BylineDisplay 
              byline={page.byline}
              fontFamily={page.bylineFont || "'Inter', sans-serif"}
            />
            <span className="font-bold not-italic" style={{ fontFamily: page.footerFont || "'Inter', sans-serif" }}>{page.footerLeft}</span>
          </div>
       </div>

      <div className="px-10 flex flex-col gap-8">
        {page.image && (
          <ImageFrame page={page} defaultHeight={300} />
        )}

        <div className="grid grid-cols-2 gap-x-12">
          {page.paragraphs?.map((p, index) => {
            const isLast = index === (page.paragraphs?.length || 0) - 1;
            const spacing = page.paragraphSpacing ?? 32;
            
            return (
              <React.Fragment key={p.id}>
                <div style={{ paddingBottom: isLast ? 0 : `${spacing}px` }}>
                  <p 
                    className="text-[17px] text-neutral-800 text-justify"
                    style={{ 
                      fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                      lineHeight: lineHeight
                    }}
                  >
                    {p.en}
                  </p>
                </div>
                <div 
                  className="border-l border-neutral-200 pl-12"
                  style={{ paddingBottom: isLast ? 0 : `${spacing}px` }}
                >
                  <p 
                    className="text-[18px] text-neutral-700 font-normal text-justify"
                    style={{ 
                      fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                      lineHeight: lineHeight
                    }}
                  >
                    {p.zh}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
