import type { ReactNode } from 'react';

export default function HudPanel({
  title,
  icon,
  actions,
  children,
  className = '',
  padded = true,
}: {
  title?: string;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`cmd-glow cmd-brackets rounded-xl bg-[#2a3d64] ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-[rgba(19,127,236,0.2)] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon ? <span className="material-symbols-outlined text-[#137fec] text-[20px]">{icon}</span> : null}
            <h3 className="text-sm font-bold tracking-wide text-[#f4f8fc] truncate">{title}</h3>
          </div>
          {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  );
}
