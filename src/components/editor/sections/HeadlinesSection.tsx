import React from 'react';
import { Type } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label, Input, TextArea } from '../../ui/Base';
import { FontSelect } from '../../ui/FontSelect';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const HeadlinesSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={Type}>Headlines & Bylines</Label>
      <div className="space-y-6">
        <div className="space-y-2">
           <div className="flex justify-between items-end gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">English Headline</span>
              <div className="w-32"><FontSelect customFonts={customFonts} value={page.titleEnFont} onChange={(v) => handleChange('titleEnFont', v)} /></div>
           </div>
           <TextArea
              rows={2}
              style={{ fontFamily: page.titleEnFont }}
              value={page.titleEn}
              onChange={(e) => handleChange('titleEn', e.target.value)}
            />
        </div>
        <div className="space-y-2">
           <div className="flex justify-between items-end gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Chinese Headline</span>
              <div className="w-32"><FontSelect customFonts={customFonts} value={page.titleZhFont} onChange={(v) => handleChange('titleZhFont', v)} /></div>
           </div>
           <TextArea
              rows={2}
              style={{ fontFamily: page.titleZhFont }}
              value={page.titleZh}
              onChange={(e) => handleChange('titleZh', e.target.value)}
            />
        </div>
        <div className="space-y-2">
           <div className="flex justify-between items-end gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Byline</span>
              <div className="w-32"><FontSelect customFonts={customFonts} value={page.bylineFont} onChange={(v) => handleChange('bylineFont', v)} /></div>
           </div>
           <Input
              type="text"
              style={{ fontFamily: page.bylineFont }}
              value={page.byline}
              onChange={(e) => handleChange('byline', e.target.value)}
            />
        </div>
      </div>
    </section>
  );
};
