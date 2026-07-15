import React from 'react';
import { Layout, ChevronDown } from 'lucide-react';
import { PageData } from '../../../types';
import { Label } from '../../ui/Base';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const LayoutSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const handleChange = (value: string) => {
    onUpdate({ ...page, layoutId: value });
  };

  return (
    <section className="space-y-4">
      <Label icon={Layout}>Page Layout</Label>
      <div className="relative group">
        <select 
          value={page.layoutId || (page.type === 'cover' ? 'classic-cover' : 'classic-article')} 
          onChange={(e) => handleChange(e.target.value)}
          className="w-full appearance-none bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-900 py-2.5 pl-3 pr-8 rounded-lg hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer"
        >
          {page.type === 'cover' ? (
            <optgroup label="Cover Layouts">
              <option value="classic-cover">Classic Editorial</option>
              <option value="impact-bold">Impact Bold</option>
              <option value="cinematic">Cinematic 16:9</option>
              <option value="blueprint">Engineering Blueprint</option>
              <option value="tabloid">Tabloid News</option>
              <option value="typography">Typographic Poster</option>
            </optgroup>
          ) : (
            <optgroup label="Article Layouts">
              <option value="classic-article">Modern Split</option>
              <option value="modern-vertical">Modern Vertical</option>
              <option value="blueprint-article">Engineering Blueprint</option>
            </optgroup>
          )}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={14} />
        </div>
      </div>
    </section>
  );
};
