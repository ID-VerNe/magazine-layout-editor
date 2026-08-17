import React from 'react';
import { Settings } from 'lucide-react';
import { PageData } from '../../../types';
import { Label } from '../../ui/Base';
import { ColorPickerField } from '../../ui/ColorPickerField';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const ColorsSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const handleChange = <K extends keyof PageData>(field: K, value: PageData[K]) => {
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={Settings}>Global Colors</Label>
      <div className="space-y-4">
        <ColorPickerField
          label="Background Color"
          value={page.backgroundColor || '#FAF9F4'}
          onChange={(v) => handleChange('backgroundColor', v)}
          placeholder="#FAF9F4"
        />
        <ColorPickerField
          label="Accent Color (Emphasis bar)"
          value={page.accentColor || '#367237'}
          onChange={(v) => handleChange('accentColor', v)}
          placeholder="#367237"
        />
      </div>
    </section>
  );
};
