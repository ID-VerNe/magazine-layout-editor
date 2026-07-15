import React from 'react';
import { Layout, GitCommit, AlignJustify } from 'lucide-react';
import { PageData } from '../../../types';
import { Label, Slider } from '../../ui/Base';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

export const ArticleAdvancedSection: React.FC<SectionProps> = ({ page, onUpdate, isOverflowing, enforceA4 }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleSpacingChange = (field: 'lineHeight' | 'paragraphSpacing', value: number) => {
    if (enforceA4 && isOverflowing) {
      const currentValue = page[field] ?? (field === 'lineHeight' ? 1.6 : 32);
      if (value > currentValue) return;
    }
    handleChange(field, value);
  };

  const currentLayout = page.layoutId || (page.type === 'cover' ? 'classic-cover' : 'classic-article');
  const isSplit = currentLayout === 'classic-article' || currentLayout === 'blueprint-article';

  return (
    <section className="space-y-6 pt-6 border-t border-slate-100">
      <Label icon={Layout}>Article Layout Options</Label>
      
      {/* Image Position Toggle */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Image Position</span>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['middle', 'bottom', 'absolute-bottom'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => handleChange('imagePosition', pos)}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-md ${
                (page.imagePosition || 'middle') === pos 
                  ? 'bg-[#264376] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {pos === 'middle' ? 'Below Title' : pos === 'bottom' ? 'Upon Footer' : 'Bottom Fixed'}
            </button>
          ))}
        </div>
      </div>

      {/* Typography Spacing (Moved here) */}
      <div className="space-y-5 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <AlignJustify size={12} className="text-[#264376]" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Typography Spacing</span>
        </div>
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
      </div>

      {isSplit && (
        <div className="space-y-5 pt-4 border-t border-slate-50 animate-in fade-in">
          <div className="flex items-center gap-2 mb-1">
            <GitCommit size={12} className="text-[#264376]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Column Balancing</span>
          </div>
          <Slider 
            label="Split Ratio" 
            value={page.splitRatio || 64} 
            min={50} max={80} step={1} 
            onChange={(v) => handleChange('splitRatio', v)} 
          />
          <Slider 
            label="Align Balance" 
            value={page.fontBalance || 0} 
            min={-5} max={5} step={0.1} 
            onChange={(v) => handleChange('fontBalance', v)} 
          />
          <p className="text-[9px] text-slate-400 italic leading-relaxed">
            Hint: Increase 'Split Ratio' or 'Align Balance' to shorten the English column.
          </p>
        </div>
      )}
    </section>
  );
};
