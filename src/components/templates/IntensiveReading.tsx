import React from 'react';
import DOMPurify from 'dompurify';
import { TemplateProps } from '../../types';
import { ArticleLayoutShell } from './ArticleLayoutShell';
import { getAnnotationThemeCSS } from '../editor/intensive/annotationHelpers';

const sanitize = (html: string) => DOMPurify.sanitize(html);

export const IntensiveReading: React.FC<TemplateProps> = ({ page, pageIndex, totalPages }) => {
  const lineHeight = page.lineHeight || 1.6;
  const ratio = page.splitRatio || 64;
  const balance = page.fontBalance || 0;
  const pageClass = `intensive-page-${page.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <ArticleLayoutShell
      page={page}
      pageIndex={pageIndex}
      totalPages={totalPages}
      className={`magazine-page ${pageClass} ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`}
    >
      <div
        className="grid relative items-stretch flex-1"
        style={{
          gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
          gap: '40px',
        }}
      >
        {/* Left Prose Article */}
        <div
          className="prose max-w-none"
          style={{
            fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
            lineHeight,
            fontSize: `${16.5 - balance * 0.5}px`,
          }}
          dangerouslySetInnerHTML={{ __html: sanitize(page.leftContent || '') }}
        />

        {/* Right Annotations Column */}
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
    </ArticleLayoutShell>
  );
};
