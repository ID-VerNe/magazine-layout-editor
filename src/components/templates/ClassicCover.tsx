import React from 'react';
import { TemplateProps } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { ImageFrame, BylineDisplay, FooterDisplay, CoverBadgeLogo, QuoteBlock } from './SharedComponents';
import { resolveCoverContentMode } from '../../utils/coverMode';
import { clampSplitRatio, clampFontBalance } from '../../utils/layoutMath';
import { DEFAULT_ACCENT } from '../../utils/themeConstants';
import { SplitParagraphBlock, SplitIntensiveGrid, AnnotationStyles, DEFAULT_EN_FONT, DEFAULT_ZH_FONT } from './SplitLayout';

export default function ClassicCover({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const ratio = clampSplitRatio(page.splitRatio);
  const balance = clampFontBalance(page.fontBalance);
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || DEFAULT_ACCENT;
  const pageClass = `intensive-page-${page.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const hasIntensiveContent = !!(page.leftContent && page.leftContent.trim());
  const hasParagraphs = !!(page.paragraphs && page.paragraphs.length > 0);
  // 正文模式：引言（quote）与双栏（split）二选一。
  // split 模式下若同时存在注解正文与段落，注解优先，避免双栏重复渲染同一内容。
  const coverIsQuote = resolveCoverContentMode(page) === 'quote';
  const showIntensive = !coverIsQuote && hasIntensiveContent;
  const showParagraphs = !coverIsQuote && hasParagraphs && !hasIntensiveContent;

  return (
    <div className={`flex flex-col h-full ${pageClass} ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`}>
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

            {coverIsQuote && (
              <div className="mt-10 pl-8 border-l-8 border-slate-200 space-y-4 py-2">
                <QuoteBlock
                  page={page}
                  enClassName="text-xl text-neutral-600 italic leading-relaxed whitespace-pre-wrap"
                  zhClassName="text-2xl text-neutral-500 font-light leading-snug whitespace-pre-wrap"
                />
              </div>
            )}

            {showIntensive && (
              <div className="mt-6">
                <SplitIntensiveGrid
                  leftContent={page.leftContent || ''}
                  annotations={page.annotations || []}
                  enFont={page.paragraphEnFont || DEFAULT_EN_FONT}
                  zhFont={page.paragraphZhFont || DEFAULT_ZH_FONT}
                  lineHeight={lineHeight}
                  ratio={ratio}
                  balance={balance}
                  hideAnnotationSeq={page.hideAnnotationSeq}
                />
              </div>
            )}

            {showParagraphs && (
              <div className="mt-6 flex flex-col">
                {page.paragraphs!.map((p, index) => {
                  const isLast = index === (page.paragraphs!.length - 1);
                  return (
                    <SplitParagraphBlock
                      key={p.id}
                      p={p}
                      enFont={page.paragraphEnFont || DEFAULT_EN_FONT}
                      zhFont={page.paragraphZhFont || DEFAULT_ZH_FONT}
                      lineHeight={lineHeight}
                      ratio={ratio}
                      balance={balance}
                      accentColor={accentColor}
                      marginBottom={!isLast ? spacing : 0}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />

      {showIntensive && (
        <AnnotationStyles
          pageClass={pageClass}
          annotationTheme={page.annotationTheme}
          hideAnnotationSeq={page.hideAnnotationSeq}
        />
      )}
    </div>
  );
}