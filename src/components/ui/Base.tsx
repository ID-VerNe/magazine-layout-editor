import React, { useState } from 'react';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';

export const Label = ({ children, icon: Icon, className = "" }: { children: React.ReactNode, icon?: any, className?: string }) => (
  <label className={`block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-3 ${className}`}>
    {Icon && <Icon size={12} />}
    {children}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ value, ...props }, ref) => (
  <input
    {...props}
    value={value ?? ''}
    ref={ref}
    className={`w-full bg-slate-50 border-transparent focus:border-[#264376] focus:bg-white focus:ring-2 focus:ring-[#264376]/20 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 ${props.className || ''}`}
  />
));
Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ value, onChange, onFocus, onBlur, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  
  const insertFormat = (prefix: string, suffix: string) => {
    const el = internalRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newValue = `${before}${prefix}${selected}${suffix}${after}`;
    
    const event = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    if (onChange) onChange(event);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative w-full">
      <div 
        className={`absolute -top-9 right-0 flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-md p-1 transition-all duration-200 z-30 ${ 
          isFocused ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-1 pointer-events-none'
        }`}
      >
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('\\b{', '}'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Bold"><Bold size={12} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('\\i{', '}'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Italic"><Italic size={12} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('\\u{', '}'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Underline"><Underline size={12} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFormat('\\s{', '}'); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Strikethrough"><Strikethrough size={12} /></button>
      </div>
      <textarea
        {...props}
        value={value ?? ''}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }}
        className={`w-full bg-slate-50 border-transparent focus:border-[#367237] focus:bg-white focus:ring-2 focus:ring-[#367237]/20 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 ${props.className || ''}`}
      />
    </div>
  );
});
TextArea.displayName = 'TextArea';

export const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <section className={`space-y-4 ${className}`}>
    {children}
  </section>
);

export const Slider = ({ label, value, min, max, step, onChange, unit = "" }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void, unit?: string }) => (
  <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2 group min-h-[24px]">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors truncate" title={label}>{label}</span>
    <div className="flex items-center h-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#264376] hover:brightness-110 transition-all"
      />
    </div>
    <div className="relative flex items-center h-full">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-[#264376] focus:ring-1 focus:ring-[#264376]/10 rounded px-1 py-0.5 text-[10px] font-bold font-mono text-slate-900 text-right focus:outline-none transition-all appearance-none" 
      />
    </div>
  </div>
);
