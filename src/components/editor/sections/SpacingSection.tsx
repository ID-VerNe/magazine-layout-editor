import React from 'react';
import { AlignJustify } from 'lucide-react';
import { PageData } from '../../../types';
import { Label, Slider } from '../../ui/Base';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

export const SpacingSection: React.FC<SectionProps> = ({ page, onUpdate, isOverflowing, enforceA4 }) => {
  const handleSpacingChange = (field: 'lineHeight' | 'paragraphSpacing', value: number) => {
    if (enforceA4 && isOverflowing) {
      const currentValue = page[field] ?? (field === 'lineHeight' ? 1.6 : 32);
      if (value > currentValue) return;
    }
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={AlignJustify}>Typography Spacing</Label>
      <div className="space-y-4 px-1">
         <Slider 
           label="Line Height" 
           value={parseFloat((page.lineHeight || 1.6).toFixed(1))} 
           min={1.0} max={2.5} step={0.1} 
           onChange={(v) => handleSpacingChange('lineHeight', v)} 
         />
         <Slider 
           label="Paragraph" 
           value={page.paragraphSpacing ?? 32} 
           min={0} max={100} step={4} 
           onChange={(v) => handleSpacingChange('paragraphSpacing', v)} 
         />
      </div>
    </section>
  );
};
