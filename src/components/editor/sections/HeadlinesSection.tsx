import React from 'react';
import { Type } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label } from '../../ui/Base';
import { FormFieldWithFont } from '../../ui/FormFieldWithFont';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const HeadlinesSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = <K extends keyof PageData>(field: K, value: PageData[K]) => {
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={Type}>Headlines & Bylines</Label>
      <div className="space-y-6">
        <FormFieldWithFont
          label="English Headline"
          value={page.titleEn}
          onChange={(v) => handleChange('titleEn', v)}
          fontFamily={page.titleEnFont}
          onFontChange={(v) => handleChange('titleEnFont', v)}
          customFonts={customFonts}
          multiline
          rows={2}
        />
        <FormFieldWithFont
          label="Chinese Headline"
          value={page.titleZh}
          onChange={(v) => handleChange('titleZh', v)}
          fontFamily={page.titleZhFont}
          onFontChange={(v) => handleChange('titleZhFont', v)}
          customFonts={customFonts}
          multiline
          rows={2}
        />
        <FormFieldWithFont
          label="Byline"
          value={page.byline}
          onChange={(v) => handleChange('byline', v)}
          fontFamily={page.bylineFont}
          onFontChange={(v) => handleChange('bylineFont', v)}
          customFonts={customFonts}
        />
      </div>
    </section>
  );
};
