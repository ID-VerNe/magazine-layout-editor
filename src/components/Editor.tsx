import React from 'react';
import { PageData, CustomFont } from '../types';
import { AlertTriangle } from 'lucide-react';

// Import Section Components
import { LayoutSection } from './editor/sections/LayoutSection';
import { ImageSection } from './editor/sections/ImageSection';
import { HeadlinesSection } from './editor/sections/HeadlinesSection';
import { CoverFeaturesSection } from './editor/sections/CoverFeaturesSection';
import { ArticleContentSection } from './editor/sections/ArticleContentSection';
import { ColorsSection } from './editor/sections/ColorsSection';
import { FooterSection } from './editor/sections/FooterSection';
import { BlueprintSettingsSection } from './editor/sections/BlueprintSettingsSection';
import { ArticleAdvancedSection } from './editor/sections/ArticleAdvancedSection';

interface EditorProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

// 定义每个布局需要的组件清单
const LAYOUT_CONFIG: Record<string, string[]> = {
  'classic-cover': ['layout', 'image', 'headlines', 'cover-features', 'advanced', 'colors', 'footer'],
  'impact-bold': ['layout', 'image', 'headlines', 'cover-features', 'colors', 'footer'],
  'cinematic': ['layout', 'image', 'headlines', 'colors', 'footer'],
  'blueprint': ['layout', 'image', 'headlines', 'blueprint-stamp', 'cover-features', 'colors', 'footer'],
  'tabloid': ['layout', 'image', 'headlines', 'advanced', 'colors', 'footer'],
  'typography': ['layout', 'headlines', 'cover-features', 'colors', 'footer'],
  'classic-article': ['layout', 'image', 'headlines', 'content', 'advanced', 'colors', 'footer'],
  'modern-vertical': ['layout', 'image', 'headlines', 'content', 'advanced', 'colors', 'footer'],
  'blueprint-article': ['layout', 'image', 'headlines', 'content', 'advanced', 'colors', 'footer']
};

const Editor: React.FC<EditorProps> = ({ page, onUpdate, customFonts, isOverflowing, enforceA4 }) => {
  const currentLayout = page.layoutId || (page.type === 'cover' ? 'classic-cover' : 'classic-article');
  const activeSections = LAYOUT_CONFIG[currentLayout] || LAYOUT_CONFIG['classic-cover'];

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'layout':
        return <LayoutSection key="layout" page={page} onUpdate={onUpdate} />;
      case 'image':
        return <ImageSection key="image" page={page} onUpdate={onUpdate} isOverflowing={isOverflowing} enforceA4={enforceA4} />;
      case 'headlines':
        return <HeadlinesSection key="headlines" page={page} onUpdate={onUpdate} customFonts={customFonts} />;
      case 'cover-features':
        return <CoverFeaturesSection key="cover-features" page={page} onUpdate={onUpdate} customFonts={customFonts} />;
      case 'content':
        return <ArticleContentSection key="content" page={page} onUpdate={onUpdate} customFonts={customFonts} />;
      case 'colors':
        return <ColorsSection key="colors" page={page} onUpdate={onUpdate} />;
      case 'footer':
        return <FooterSection key="footer" page={page} onUpdate={onUpdate} customFonts={customFonts} />;
      case 'blueprint-stamp':
        return <BlueprintSettingsSection key="blueprint-stamp" page={page} onUpdate={onUpdate} />;
      case 'advanced':
        return <ArticleAdvancedSection key="advanced" page={page} onUpdate={onUpdate} isOverflowing={isOverflowing} enforceA4={enforceA4} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {enforceA4 && isOverflowing && (
        <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <h4 className="text-red-800 text-xs font-bold uppercase tracking-wider">Content Overflow</h4>
            <p className="text-red-600 text-[10px] mt-1 leading-relaxed">Content exceeds page limits. Growth parameters are locked.</p>
          </div>
        </div>
      )}

      {activeSections.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default Editor;