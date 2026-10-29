import { hubNodes, type MockView } from '../mockData';

export default function CommandPalette({
  value,
  onChange,
  onEnter,
  onOpenNewClients,
  placeholder = 'Awaiting command…  try “new clients” or “itineraries”',
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: (view: Exclude<MockView, 'hub'>) => void;
  onOpenNewClients?: () => void;
  placeholder?: string;
}) {
  const q = value.trim().toLowerCase();
  const wantsNew = q.includes('new') || q.includes('intake') || q.includes('jotform');
  const matches = hubNodes.filter((n) => !q || n.label.toLowerCase().includes(q) || n.id.includes(q) || (n.id === 'clients' && wantsNew));

  return (
    <div className="w-full max-w-2xl">
      <label className="cmd-glow-strong cmd-hover-palette flex items-center gap-3 rounded-2xl bg-[#1e2d4a]/90 backdrop-blur-md px-4 h-12 w-full">
        <span className="material-symbols-outlined text-sky-300">terminal</span>
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#c5d4e6]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (wantsNew && onOpenNewClients) onOpenNewClients();
              else if (matches[0]) onEnter(matches[0].id);
            }
          }}
          placeholder={placeholder}
        />
        <kbd className="hidden sm:inline text-[10px] text-[#d5e2f2] border border-sky-400/30 rounded px-1.5 py-0.5">
          enter
        </kbd>
      </label>
      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {onOpenNewClients ? (
          <button type="button" onClick={onOpenNewClients} className="cmd-hover-nav rounded-full px-2.5 py-1 text-xs bg-sky-400/15 text-sky-100">
            New clients
          </button>
        ) : null}
        {matches.slice(0, 5).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => onEnter(n.id)}
            className="cmd-hover-nav rounded-full px-2.5 py-1 text-xs bg-white/5 text-[#e8f1fb]"
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
