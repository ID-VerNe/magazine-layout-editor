import React, { useEffect } from 'react';
import { Type, Upload, Trash2, X } from 'lucide-react';
import { CustomFont } from '../types';

interface FontManagerProps {
  fonts: CustomFont[];
  onFontsChange: (fonts: CustomFont[] | ((prev: CustomFont[]) => CustomFont[])) => void;
  onClose?: () => void;
}

export default function FontManager({ fonts, onFontsChange, onClose }: FontManagerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // Include random alphanumeric string to prevent collision within the same millisecond
        const randomId = Math.random().toString(36).slice(2, 7);
        const safeName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const family = `custom-${Date.now()}-${randomId}-${safeName}`;
        onFontsChange(prev => [...prev, { name: file.name, family, dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFont = (family: string) => {
    onFontsChange(prev => prev.filter(f => f.family !== family));
    const styleEl = document.getElementById(`style-${family}`);
    if (styleEl) styleEl.remove();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="font-manager-title"
      className="w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Type size={16} className="text-[#264376]" aria-hidden="true" />
          <h3 id="font-manager-title" className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Font Manager ({fonts.length})
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Font Manager"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <label
          className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 hover:border-[#264376] rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors focus-within:ring-2 focus-within:ring-[#264376]"
          aria-label="Upload custom font file"
        >
          <Upload size={14} className="text-slate-400" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-600">Upload Font (.ttf, .otf, .woff, .woff2)</span>
          <input
            type="file"
            multiple
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
          {fonts.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">No custom fonts uploaded yet.</p>
          ) : (
            fonts.map(font => (
              <div
                key={font.family}
                className="flex justify-between items-center p-2 rounded-lg bg-slate-50 hover:bg-slate-100 group transition-colors"
              >
                <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]" style={{ fontFamily: font.family }}>
                  {font.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFont(font.family)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label={`Remove font ${font.name}`}
                  title="Remove font"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}