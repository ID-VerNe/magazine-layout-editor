import React from 'react';
import { Layout } from 'lucide-react';
import { PageData } from '../../../types';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
}

export const BlueprintSettingsSection: React.FC<SectionProps> = ({ page, onUpdate }) => {
  if (page.layoutId !== 'blueprint' && page.layoutId !== 'blueprint-article') return null;

  const isApproved = page.showApprovedStamp !== false;

  return (
    <section className="space-y-4 py-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Layout size={12} aria-hidden="true" /> Blueprint Stamp
        </span>
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-700 transition-colors">
            Show Approved
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isApproved}
            aria-label="Show approved blueprint stamp"
            className={`w-8 h-4 rounded-full relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] focus-visible:ring-offset-1 ${
              isApproved ? 'bg-[#264376]' : 'bg-slate-200'
            }`}
            onClick={() => onUpdate({ ...page, showApprovedStamp: !isApproved })}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onUpdate({ ...page, showApprovedStamp: !isApproved });
              }
            }}
          >
            <span
              className={`block absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${
                isApproved ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
    </section>
  );
};
