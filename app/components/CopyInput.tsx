"use client";
import React, { useRef } from 'react';
import { Copy } from 'lucide-react';

export default function CopyInput({ value }: { value: string }) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch (e) {
      // swallow copy errors silently
    }
  };

  return (
    <>
      <input
        readOnly
        ref={ref}
        value={value}
        onClick={() => ref.current?.select()}
        className="bg-slate-100 text-[10px] px-3 py-2 rounded-xl border border-slate-200 w-80 font-mono text-slate-500 outline-none cursor-pointer"
      />
      <button
        title="Copy Tracking Link"
        className="p-2.5 text-indigo-500 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm"
        onClick={handleCopy}
        type="button"
      >
        <Copy size={14} />
      </button>
    </>
  );
}
