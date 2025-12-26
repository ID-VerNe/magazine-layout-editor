import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CustomFont } from '../../types';

interface FontSelectProps {
  value?: string;
  onChange: (v: string) => void;
  label?: string;
  customFonts: CustomFont[];
}

export const FontSelect: React.FC<FontSelectProps> = ({ value, onChange, label, customFonts }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>}
    <div className="relative group">
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white text-xs font-medium text-slate-700 py-1.5 pl-2 pr-6 rounded hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer border border-transparent hover:border-slate-200"
      >
        <option value="">Default Font</option>
        <optgroup label="Custom Fonts">
          {customFonts.map(f => (
            <option key={f.family} value={f.family}>{f.name}</option>
          ))}
        </optgroup>
        <optgroup label="System">
           <option value="'Inter', sans-serif">Inter</option>
           <option value="'Crimson Pro', serif">Crimson Pro</option>
           <option value="'Noto Serif SC', serif">Noto Serif SC</option>
        </optgroup>
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);
