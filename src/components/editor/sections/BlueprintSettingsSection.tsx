import React from 'react';
import { Layout } from 'lucide-react';
import { PageData } from '../../../types';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const BlueprintSettingsSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  if (page.layoutId !== 'blueprint') return null;

  return (
    <section className="space-y-4 py-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layout size={12} /> Blueprint Stamp
        </span>
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="text-[9px] text-slate-400 font-bold uppercase group-hover:text-slate-600 transition-colors">Show Approved</span>
          <div 
            className={`w-8 h-4 rounded-full relative transition-colors ${page.showApprovedStamp !== false ? 'bg-[#264376]' : 'bg-slate-200'}`}
            onClick={() => onUpdate({ ...page, showApprovedStamp: page.showApprovedStamp === false })}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${page.showApprovedStamp !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
    </section>
  );
};
