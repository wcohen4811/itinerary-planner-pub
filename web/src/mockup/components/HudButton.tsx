import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'primary' | 'ghost' | 'danger' | 'ok';

const tones: Record<Tone, string> = {
  primary: 'bg-[#137fec] text-white hover:bg-[#0f6fd0] shadow-[0_0_16px_rgba(19,127,236,0.35)]',
  ghost: 'bg-transparent text-[#c5d4e6] border border-[rgba(19,127,236,0.35)] hover:bg-[#137fec]/10',
  danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
  ok: 'bg-[#059669] text-white hover:bg-[#047857]',
};

export default function HudButton({
  tone = 'ghost',
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; icon?: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      className={`cmd-hover-btn inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide disabled:opacity-50 ${tones[tone]} ${className}`}
      {...rest}
    >
      {icon ? <span className="material-symbols-outlined text-[18px]">{icon}</span> : null}
      {children}
    </button>
  );
}
