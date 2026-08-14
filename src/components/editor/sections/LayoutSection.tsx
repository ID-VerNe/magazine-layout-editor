import React from 'react';
import { Layout, ChevronDown } from 'lucide-react';
import { PageData } from '../../../types';
import { Label } from '../../ui/Base';
import { TEMPLATES } from '../../../config/templates';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const LayoutSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  const handleChange = (value: string) => {
    onUpdate({ ...page, layoutId: value });
  };

  const coverTemplates = TEMPLATES.filter(tpl => tpl.type === 'cover');
  const articleTemplates = TEMPLATES.filter(tpl => tpl.type === 'article');

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
              {coverTemplates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </optgroup>
          ) : (
            <optgroup label="Article Layouts">
              {articleTemplates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
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
