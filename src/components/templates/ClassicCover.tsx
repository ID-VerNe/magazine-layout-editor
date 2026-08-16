import React from 'react';
import DOMPurify from 'dompurify';
import { TemplateProps } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { ImageFrame, BylineDisplay, FooterDisplay, CoverBadgeLogo } from './SharedComponents';
import { formatMagazineText } from '../../utils/formatter';
import { getAnnotationThemeCSS } from '../editor/intensive/annotationHelpers';

const sanitize = (html: string) => DOMPurify.sanitize(html);

export default function ClassicCover({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const ratio = page.splitRatio || 64;
  const balance = page.fontBalance || 0;
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || '#367237';
  const pageClass = `intensive-page-${page.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const hasIntensiveContent = !!(page.leftContent && page.leftContent.trim());
  const hasParagraphs = !!(page.paragraphs && page.paragraphs.length > 0);

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
                fontFamily={page.bylineFont || "'Inter', sans-serif"
                }
                className="text-xl text-neutral-500"
              />
            </div>

            {hasIntensiveContent && (
              <div className="mt-6">
                <div
                  className="grid relative items-stretch"
                  style={{
                    gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
                    gap: '40px',
                  }}
                >
                  <div
                    className="prose max-w-none"
                    style={{
                      fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                      lineHeight,
                      fontSize: `${16.5 - balance * 0.5}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitize(page.leftContent || '') }}
                  />
                  <div
                    className="border-l pl-10 border-neutral-200 prose max-w-none"
                    style={{
                      fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                      lineHeight,
                      fontSize: `${14 + balance * 0.5}px`,
                    }}
                  >
                    {(page.annotations || []).map((ann) => (
                      <div key={ann.id} className="annotation-block">
                        <div className="annotation-label">
                          {!page.hideAnnotationSeq && <span className="annotation-seq">[{ann.seq}]</span>}{' '}
                          <span className="annotation-word" style={ann.fontSize ? { fontSize: ann.fontSize } : undefined}>
                            {ann.text}
                          </span>
                        </div>
                        <div
                          className="annotation-content"
                          dangerouslySetInnerHTML={{ __html: sanitize(ann.comment || '') }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasParagraphs && (
              <div className="mt-6 flex flex-col">
                {page.paragraphs!.map((p, index) => {
                  const isLast = index === (page.paragraphs!.length - 1);
                  return (
                    <div
                      key={p.id}
                      className="grid relative items-stretch"
                      style={{
                        gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
                        gap: '40px',
                        marginBottom: !isLast ? `${spacing}px` : 0,
                      }}
                    >
                      <div
                        className={`transition-all duration-300 ${p.emphasis ? 'p-4 rounded-lg border-l-4' : ''}`}
                        style={{
                          backgroundColor: p.emphasis ? `${accentColor}10` : 'transparent',
                          borderLeftColor: p.emphasis ? accentColor : 'transparent',
                        }}
                      >
                        <p
                          className="text-justify whitespace-pre-wrap"
                          style={{
                            fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                            lineHeight,
                            fontSize: `${16.5 - balance * 0.5}px`,
                          }}
                        >
                          {formatMagazineText(p.en || '')}
                        </p>
                      </div>
                      <div
                        className="border-l pl-10 transition-all duration-300"
                        style={{
                          borderLeftColor: p.emphasis ? `${accentColor}40` : '#e5e5e5',
                          backgroundColor: p.emphasis ? `${accentColor}08` : 'transparent',
                        }}
                      >
                        <p
                          className="text-neutral-700 font-normal text-justify whitespace-pre-wrap"
                          style={{
                            fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                            lineHeight,
                            fontSize: `${19 + balance * 0.8}px`,
                          }}
                        >
                          {formatMagazineText(p.zh || '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />

      {hasIntensiveContent && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
             .${pageClass} mark[data-annotation-id] {
               ${getAnnotationThemeCSS(page.annotationTheme)}
               position: relative;
               color: inherit;
             }
             ${
               !page.hideAnnotationSeq
                 ? `
             .${pageClass} mark[data-annotation-id]::after {
               content: "[" attr(data-seq) "]";
               vertical-align: super;
               font-size: 0.75em;
               color: inherit;
               margin-left: 2px;
               font-weight: bold;
             }
             `
                 : ''
             }
           `,
          }}
        />
      )}
    </div>
  );
}
