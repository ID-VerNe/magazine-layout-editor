import React from 'react';
import { Settings } from 'lucide-react';
import { PageData } from '../../../types';
import { Label, Input, Section } from '../../ui/Base';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const ColorsSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={Settings}>Global Colors</Label>
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
            <div className="relative overflow-hidden w-10 h-10 rounded-lg shadow-sm ring-1 ring-slate-200" title="Background Color">
                <input 
                type="color" 
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                value={page.backgroundColor || '#FAF9F4'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                />
            </div>
            <Input 
                type="text" 
                className="font-mono uppercase"
                value={page.backgroundColor || '#FAF9F4'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
        </div>
        <div className="flex gap-3 items-center">
            <div className="relative overflow-hidden w-10 h-10 rounded-lg shadow-sm ring-1 ring-slate-200" title="Accent Color (Emphasis bar)">
                <input 
                type="color" 
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                value={page.accentColor || '#367237'}
                onChange={(e) => handleChange('accentColor', e.target.value)}
                />
            </div>
            <Input 
                type="text" 
                className="font-mono uppercase"
                placeholder="Accent Color"
                value={page.accentColor || '#367237'}
                onChange={(e) => handleChange('accentColor', e.target.value)}
            />
        </div>
      </div>
    </section>
  );
};
