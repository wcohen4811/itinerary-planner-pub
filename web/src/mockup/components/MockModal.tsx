import type { ReactNode } from 'react';
import HudButton from './HudButton';

export default function MockModal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative cmd-glow cmd-brackets cmd-fade-in w-[95vw] ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-xl bg-[#2a3d64]`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(19,127,236,0.22)]">
          <h3 className="text-base font-bold tracking-wide">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#d5e2f2] hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="px-5 py-4 text-sm text-[#c5d4e6] max-h-[70vh] overflow-y-auto cmd-scroll">{children}</div>
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[rgba(19,127,236,0.18)]">
          {footer ?? <HudButton onClick={onClose}>Close</HudButton>}
        </footer>
      </div>
    </div>
  );
}
