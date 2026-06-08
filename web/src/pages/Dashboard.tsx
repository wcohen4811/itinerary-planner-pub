import { useEffect, useRef, useState } from 'react';
import { useDashboardBackend } from '../services/dashboard';
import { ImportTitleConflictError, type ImportTitleConflict, type ItineraryMessageTemplate } from '../api/client';
import StitchShell from '../components/StitchShell';
import { useAuth } from '../auth/auth';

function applyImportResolution(
  base: Record<string, unknown>,
  resolution: 'merge_into_existing' | 'create_new',
  mergeIntoItineraryId?: string,
) {
  return {
    ...base,
    resolution,
    ...(resolution === 'merge_into_existing' && mergeIntoItineraryId ? { mergeIntoItineraryId } : {}),
  };
}

function WarningModal({
  open,
  onClose,
  onEdit,
  onDuplicate,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[95vw] max-w-lg rounded-lg bg-white p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-3">WARNING</h3>
        <p className="text-sm text-gray-700 mb-4">
          You have selected an existing itinerary. Would you like to make edits to this version or make a duplicate version and create a new itinerary?
        </p>
        <div className="flex items-center justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded-md border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
            onClick={() => {
              onDuplicate();
              onClose();
            }}
          >
            Make a Duplicate
          </button>
          <button
            className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => {
              onEdit();
              onClose();
            }}
          >
            Edit this Version
          </button>
        </div>
      </div>
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  className,
  placeholder,
  minRows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      placeholder={placeholder}
      rows={minRows}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
    />
  );
}

function PricingTableRow({
  item,
  badgeClassName,
  badgeLabel,
  onSave,
  onDelete,
}: {
  item: { id: string; name: string; amountUsd: number };
  badgeClassName: string;
  badgeLabel: string;
  onSave: (patch: { name: string; amountUsd: number }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.amountUsd));

  useEffect(() => {
    setName(item.name);
    setAmount(String(item.amountUsd));
  }, [item.id, item.name, item.amountUsd]);

  const toUsd = (val: string) => Math.max(0, Math.floor(Number(val) || 0));
  const commit = () => {
    const next = name.trim() || item.name;
    const nextAmount = toUsd(amount);
    if (next !== item.name || nextAmount !== item.amountUsd) {
      onSave({ name: next, amountUsd: nextAmount });
    }
  };

  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-[#1e2a36] transition-colors">
      <td className="px-6 py-3">
        <input
          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#111418] dark:text-white font-medium placeholder-gray-400"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </td>
      <td className="px-6 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClassName}`}>
          {badgeLabel}
        </span>
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center justify-end gap-1">
          <span className="text-gray-400">$</span>
          <input
            className="w-24 text-right bg-transparent border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary text-[#111418] dark:text-white font-bold"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={commit}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <button className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" onClick={onDelete}>
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </td>
    </tr>
  );
}

function LineItemModal({
  open,
  title,
  showSaveTemplate,
  templates,
  name,
  amount,
  saveTemplate,
  onSelectTemplate,
  onChangeName,
  onChangeAmount,
  onChangeSaveTemplate,
  onCancel,
  onSave,
}: {
  open: boolean;
  title: string;
  showSaveTemplate: boolean;
  templates: { id: string; name: string; amountUsd?: number }[];
  name: string;
  amount: string;
  saveTemplate: boolean;
  onSelectTemplate: (templateId: string) => void;
  onChangeName: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangeSaveTemplate: (v: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-[95vw] max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="space-y-3">
          {templates.length > 0 ? (
            <label className="text-sm text-gray-700 flex flex-col gap-1">
              Use saved line item
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  onSelectTemplate(val);
                }}
              >
                <option value="">Select a saved item</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Line Item Name
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="e.g., Extra excursion"
            />
          </label>
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Amount (USD)
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min={0}
                className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={amount}
                onChange={(e) => onChangeAmount(e.target.value)}
              />
            </div>
          </label>
          {showSaveTemplate ? (
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveTemplate}
                onChange={(e) => onChangeSaveTemplate(e.target.checked)}
              />
              Save this line item for future itineraries
            </label>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="px-3 py-2 text-sm rounded-md border" onClick={onCancel}>
            Cancel
          </button>
          <button className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white" onClick={onSave}>
            Save Line Item
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishModal({
  open,
  progress,
  done,
  error,
  onClose,
}: {
  open: boolean;
  progress: number;
  done: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-[95vw] max-w-md rounded-lg bg-white p-6 shadow-lg">
        {!done && !error ? (
          <>
            <h3 className="text-lg font-semibold mb-3">Saving your edits…</h3>
            <div className="w-full h-3 bg-gray-200 rounded">
              <div
                className="h-3 bg-indigo-600 rounded"
                style={{ width: `${Math.max(5, Math.floor(progress * 100))}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">{Math.floor(progress * 100)}%</div>
          </>
        ) : error ? (
          <>
            <h3 className="text-lg font-semibold mb-3 text-rose-700">Something went wrong</h3>
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            <div className="flex justify-end">
              <button className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-3">Yay! your data is safe and sound</h3>
            <div className="flex justify-end">
              <button className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white" onClick={onClose}>
                yay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ImportModal({
  open,
  loading,
  error,
  hasJson,
  onPickFile,
  onImport,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  hasJson: boolean;
  onPickFile: (file: File) => void;
  onImport: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const example = `{
  "title": "Classic Machu Picchu",
  "description": "Experience Peru’s iconic highlights...",
  "netPriceUsd": 4200,
  "perPersonTotalUsd": 2100,
  "days": [
    { "dayNumber": 1, "title": "Arrive Lima", "description": "Arrival and settle in.", "hotelName": "Casa Andina Classic", "transferCount": 1, "netPriceUsd": 800 },
    { "dayNumber": 2, "title": "Lima City", "description": "Explore historic center & cuisine.", "hotelName": "Casa Andina Classic", "transferCount": 0, "perPersonTotalUsd": 450 }
  ]
}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-[95vw] max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Import itinerary (JSON or Excel)</h3>
        <p className="text-sm text-gray-700 mb-2">
          Upload <span className="font-semibold">.json</span> or <span className="font-semibold">.xlsx</span>. If the{' '}
          <span className="font-semibold">title</span> matches an itinerary you already have, you can merge imported pricing into that trip or create a second itinerary from the file—nothing is overwritten automatically.
        </p>
        <p className="text-sm text-gray-700 mb-2">
          JSON: require <span className="font-semibold">title</span> and, for each day, <span className="font-semibold">dayNumber</span>,{' '}
          <span className="font-semibold">title</span>, <span className="font-semibold">description</span>, <span className="font-semibold">hotelName</span>, and{' '}
          <span className="font-semibold">transferCount</span>. Optional fields such as <span className="font-semibold">netPriceUsd</span> and{' '}
          <span className="font-semibold">perPersonTotalUsd</span> become pricing line items so totals stay visible.
        </p>
        <p className="text-sm text-gray-700 mb-2">
          Excel: first row is headers — use labels like Day number, Title, Description, Hotel, Transfers, Net price, Per person total, Itinerary title.
        </p>
        <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap mb-3">
{example}
        </pre>
        {error ? <div className="text-sm text-rose-700 mb-2">{error}</div> : null}
        <div className="flex items-center justify-between">
          <label className="px-3 py-2 text-sm rounded-md border cursor-pointer inline-flex items-center gap-2">
            <input
              type="file"
              accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onPickFile(f);
                e.currentTarget.value = '';
              }}
            />
            Upload file
            {loading ? <span className="ml-2 inline-block h-4 w-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" /> : null}
          </label>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm rounded-md border" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white disabled:opacity-50"
              disabled={!hasJson || loading}
              onClick={onImport}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportTitleConflictModal({
  open,
  conflict,
  loading,
  onMerge,
  onCreateNew,
  onCancel,
}: {
  open: boolean;
  conflict: ImportTitleConflict | null;
  loading: boolean;
  onMerge: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}) {
  if (!open || !conflict) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="relative w-[95vw] max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-[#1a2633]">
        <h3 className="text-lg font-semibold mb-2 text-[#111418] dark:text-white">This title already exists</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          You already have an itinerary named{' '}
          <span className="font-semibold">&quot;{conflict.existingItinerary.title}&quot;</span>. Choose how to apply this import.
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 mb-4 space-y-2">
          <li>
            <span className="font-medium text-[#111418] dark:text-gray-200">Merge into existing</span> — append imported pricing line items to that itinerary. Existing days are kept; day numbers from the file that are missing are added as new days. Nothing is deleted.
          </li>
          <li>
            <span className="font-medium text-[#111418] dark:text-gray-200">Create new itinerary</span> — create another itinerary from this file (full days and pricing). You can keep the same title; it will be a separate record.
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" className="px-3 py-2 text-sm rounded-md border dark:border-gray-600 dark:text-gray-200" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white disabled:opacity-50"
            onClick={onCreateNew}
            disabled={loading}
          >
            Create new itinerary
          </button>
          <button type="button" className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-50" onClick={onMerge} disabled={loading}>
            Merge into existing
          </button>
        </div>
      </div>
    </div>
  );
}

function NewItineraryModal({
  open,
  onClose,
  onCreateBlank,
  onChooseImport,
  duplicateItems,
  onDuplicateFrom,
}: {
  open: boolean;
  onClose: () => void;
  onCreateBlank: (opts: { title: string; startDateIso: string; blankPricing: boolean }) => void;
  onChooseImport: () => void;
  duplicateItems: { id: string; title: string }[];
  onDuplicateFrom: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [blankPricing, setBlankPricing] = useState(false);
  const [dupId, setDupId] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDateStr(new Date().toISOString().slice(0, 10));
    setBlankPricing(false);
    setDupId(duplicateItems[0]?.id ?? '');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-[95vw] max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-[#1a2633]">
        <h3 className="text-lg font-semibold mb-3 text-[#111418] dark:text-white">New itinerary</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Start empty (optionally without default pricing placeholders), import from JSON or Excel (you choose merge vs. new trip if the title matches), or duplicate a trip you already have.
        </p>
        <div className="space-y-3 mb-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[#111418] dark:text-gray-200">Title</span>
            <input
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0f1724] px-3 py-2 text-[#111418] dark:text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Classic Peru"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[#111418] dark:text-gray-200">Start date</span>
            <input
              type="date"
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0f1724] px-3 py-2 text-[#111418] dark:text-white"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-1" checked={blankPricing} onChange={(e) => setBlankPricing(e.target.checked)} />
            <span className="text-gray-700 dark:text-gray-300">
              Blank pricing: skip default hotel/activity line items on new days (add your own line items when ready).
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md bg-primary text-white font-semibold"
            onClick={() => {
              const iso = new Date(`${dateStr}T12:00:00`).toISOString();
              onCreateBlank({ title: title.trim() || 'Untitled itinerary', startDateIso: iso, blankPricing });
              onClose();
            }}
          >
            Create blank itinerary
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-600 dark:text-gray-200"
            onClick={() => {
              onChooseImport();
            }}
          >
            Import JSON / Excel…
          </button>
        </div>
        {duplicateItems.length > 0 ? (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <p className="text-sm font-medium text-[#111418] dark:text-gray-200 mb-2">Duplicate existing</p>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                className="flex-1 min-w-[12rem] rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0f1724] px-2 py-2 text-sm text-[#111418] dark:text-white"
                value={dupId}
                onChange={(e) => setDupId(e.target.value)}
              >
                {duplicateItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white"
                onClick={() => {
                  if (dupId) {
                    onDuplicateFrom(dupId);
                    onClose();
                  }
                }}
              >
                Duplicate
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex justify-end mt-4">
          <button type="button" className="px-3 py-2 text-sm rounded-md border dark:border-gray-600 dark:text-gray-200" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DayLibraryModal({
  open,
  query,
  loading,
  results,
  onQueryChange,
  onSearch,
  onSelect,
  onClose,
}: {
  open: boolean;
  query: string;
  loading: boolean;
  results: { id: string; title: string; itineraryTitle: string; description: string }[];
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[95vw] max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Add Saved Day</h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Search saved days…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button className="px-3 py-2 text-sm rounded-md border" onClick={onSearch}>
            Search
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Searching…</div>
        ) : results.length === 0 ? (
          <div className="text-sm text-gray-500">No saved days found.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {results.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-md p-3">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-gray-500">From: {r.itineraryTitle}</div>
                <div className="text-sm text-gray-700 mt-1 line-clamp-2">{r.description}</div>
                <div className="mt-2">
                  <button className="px-3 py-1 text-sm rounded-md border" onClick={() => onSelect(r.id)}>
                    Add this day
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button className="px-3 py-2 text-sm rounded-md border" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateModal({
  open,
  mode,
  name,
  sku,
  kind,
  amount,
  onChangeName,
  onChangeKind,
  onChangeAmount,
  onCancel,
  onSave,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  name: string;
  sku?: string;
  kind: 'hotel' | 'activity' | 'custom' | 'general' | 'fee';
  amount: string;
  onChangeName: (v: string) => void;
  onChangeKind: (v: 'hotel' | 'activity' | 'custom' | 'general' | 'fee') => void;
  onChangeAmount: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-[95vw] max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">{mode === 'create' ? 'New Pricing Template' : 'Edit Pricing Template'}</h3>
        <div className="space-y-3">
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Name
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
            />
          </label>
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Kind
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => onChangeKind(e.target.value as any)}
            >
              <option value="custom">custom</option>
              <option value="hotel">hotel</option>
              <option value="activity">activity</option>
              <option value="general">general</option>
              <option value="fee">fee</option>
            </select>
          </label>
          <label className="text-sm text-gray-700 flex flex-col gap-1">
            Default Amount (USD)
            <input
              type="number"
              min={0}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={amount}
              onChange={(e) => onChangeAmount(e.target.value)}
            />
          </label>
          <label className="text-sm text-gray-500 flex flex-col gap-1">
            SKU (auto-generated)
            <input
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
              value={sku ?? 'Will be generated'}
              readOnly
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="px-3 py-2 text-sm rounded-md border" onClick={onCancel}>
            Cancel
          </button>
          <button className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={onSave}>
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const b = useDashboardBackend();
  const { isAdmin } = useAuth();
  const selected = b.getSelected();
  const [showWarning, setShowWarning] = useState(false);
  const [crmView, setCrmView] = useState<'itineraries' | 'pricing-library'>('itineraries');
  const [pricingFlips, setPricingFlips] = useState<Record<string, boolean>>({});
  const [pricingPanelOpen, setPricingPanelOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true);
  const [tempTitle, setTempTitle] = useState('');
  const [descValue, setDescValue] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubDone, setPubDone] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);
  const [pubProgress, setPubProgress] = useState(0);
  const [newItinOpen, setNewItinOpen] = useState(false);
  const [impOpen, setImpOpen] = useState(false);
  const [impLoading, setImpLoading] = useState(false);
  const [impError, setImpError] = useState<string | null>(null);
  const [impJson, setImpJson] = useState<any | null>(null);
  const [importTitleConflict, setImportTitleConflict] = useState<ImportTitleConflict | null>(null);
  const [lineModal, setLineModal] = useState<{ mode: 'general' | 'fee' | 'day'; dayId?: string } | null>(null);
  const [lineName, setLineName] = useState('');
  const [lineAmount, setLineAmount] = useState('0');
  const [lineSaveTemplate, setLineSaveTemplate] = useState(false);
  const [dayLibraryOpen, setDayLibraryOpen] = useState(false);
  const [dayLibraryQuery, setDayLibraryQuery] = useState('');
  const [dayLibraryLoading, setDayLibraryLoading] = useState(false);
  const [dayLibraryResults, setDayLibraryResults] = useState<
    { id: string; title: string; itineraryTitle: string; description: string }[]
  >([]);
  const [messageTemplateOpen, setMessageTemplateOpen] = useState(false);
  const [messageTemplateDraft, setMessageTemplateDraft] = useState<ItineraryMessageTemplate>({});
  const [messageTemplateSaving, setMessageTemplateSaving] = useState(false);
  const [messageTemplateSaved, setMessageTemplateSaved] = useState(false);
  const [messageTemplateError, setMessageTemplateError] = useState<string | null>(null);
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateModal, setTemplateModal] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateKind, setTemplateKind] = useState<'hotel' | 'activity' | 'custom' | 'general' | 'fee'>('custom');
  const [templateAmount, setTemplateAmount] = useState('0');
  const [pendingScrollDayId, setPendingScrollDayId] = useState<string | null>(null);
  const dayRefs = useRef<Record<string, HTMLElement | null>>({});
  const [dayActionConfirm, setDayActionConfirm] = useState<{
    type: 'move' | 'delete';
    dayId: string;
    dir?: -1 | 1;
  } | null>(null);
  const greetingRef = useRef<HTMLInputElement>(null);
  const generalMessageRef = useRef<HTMLTextAreaElement>(null);
  const keyDetailsRef = useRef<HTMLTextAreaElement>(null);
  const cabinAvailabilityRef = useRef<HTMLInputElement>(null);
  const flightPricingRef = useRef<HTMLInputElement>(null);
  const inclusionsRef = useRef<HTMLTextAreaElement>(null);
  const exclusionsRef = useRef<HTMLTextAreaElement>(null);
  const discountLabelRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const discountMessageRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  const allFlipped = !!selected && selected.days.length > 0 && selected.days.every((d) => pricingFlips[d.id]);
  const flipAll = (toPricing: boolean) => {
    if (!selected) return;
    setPricingFlips((prev) => {
      const next = { ...prev };
      for (const d of selected.days) next[d.id] = toPricing;
      return next;
    });
  };

  async function runImportWithResolution(
    resolution: 'merge_into_existing' | 'create_new',
    mergeIntoItineraryId?: string,
  ) {
    if (!impJson) return;
    try {
      setImpLoading(true);
      const payload = applyImportResolution(impJson as Record<string, unknown>, resolution, mergeIntoItineraryId);
      await b.importItinerariesFromJson(payload);
      setImpOpen(false);
      setImpJson(null);
      setImpError(null);
      setImportTitleConflict(null);
    } catch (e: unknown) {
      if (e instanceof ImportTitleConflictError) {
        setImportTitleConflict(e.conflict);
        setImpError(null);
      } else {
        setImpError(e instanceof Error ? e.message : 'Import failed.');
      }
    } finally {
      setImpLoading(false);
    }
  }

  const toUsd = (val: string) => Math.max(0, Math.floor(Number(val) || 0));
  const toLines = (value?: string[]) => (value && value.length ? value.join('\n') : '');
  const fromLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);
  const updateMessageTemplate = (patch: Partial<ItineraryMessageTemplate>) => {
    setMessageTemplateDraft((prev) => ({ ...prev, ...patch }));
  };
  const placeholderOptions = [
    { label: 'Client name', token: '{{clientName}}' },
    { label: 'Itinerary name', token: '{{itineraryName}}' },
    { label: 'Start date', token: '{{startDate}}' },
    { label: 'Flight pricing', token: '{{flightPricing}}' },
    { label: 'Discount percentage', token: '{{discountPercentage}}' },
    { label: 'Discount deadline', token: '{{discountDeadline}}' },
  ];
  const insertToken = (
    rawValue: string,
    token: string,
    inputEl?: HTMLInputElement | HTMLTextAreaElement | null,
  ) => {
    const value = rawValue ?? '';
    if (inputEl && typeof inputEl.selectionStart === 'number') {
      const start = inputEl.selectionStart ?? value.length;
      const end = inputEl.selectionEnd ?? start;
      const next = value.slice(0, start) + token + value.slice(end);
      requestAnimationFrame(() => {
        try {
          inputEl.focus();
          const pos = start + token.length;
          inputEl.setSelectionRange(pos, pos);
        } catch {}
      });
      return next;
    }
    const spacer = value && !value.endsWith(' ') ? ' ' : '';
    return `${value}${spacer}${token}`;
  };
  const renderPlaceholderSelect = (onInsert: (token: string) => void) => (
    <select
      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-500"
      defaultValue=""
      onChange={(e) => {
        const token = e.target.value;
        if (!token) return;
        onInsert(token);
        e.currentTarget.value = '';
      }}
    >
      <option value="">Insert placeholder</option>
      {placeholderOptions.map((opt) => (
        <option key={opt.token} value={opt.token}>
          {opt.label}
        </option>
      ))}
    </select>
  );
  const updateDiscount = (index: number, patch: { label?: string; message?: string; startDate?: string | null; endDate?: string | null }) => {
    setMessageTemplateDraft((prev) => {
      const next = [...(prev.discounts ?? [])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, discounts: next };
    });
  };
  const addDiscount = () => {
    setMessageTemplateDraft((prev) => ({
      ...prev,
      discounts: [...(prev.discounts ?? []), { label: '', message: '', startDate: null, endDate: null }],
    }));
  };
  const removeDiscount = (index: number) => {
    setMessageTemplateDraft((prev) => {
      const next = [...(prev.discounts ?? [])];
      next.splice(index, 1);
      return { ...prev, discounts: next };
    });
  };

  // Prime temp title when selection changes
  useEffect(() => {
    if (selected) {
      setTempTitle(selected.title);
      const template =
        'Experience Peru’s iconic highlights with thoughtful acclimatization. Explore Lima’s culinary scene, Cusco’s history, the Sacred Valley’s living culture, and the citadel of Machu Picchu.\n\n' +
        'PERSONALIZATION\n' +
        'Traveler prefers cultural immersion and soft adventure.\n\n' +
        'INTERESTS\n' +
        'History, cuisine, photography.\n\n' +
        'DEPARTURE DATES\n' +
        'Flexible; target next quarter.\n\n' +
        'GROUP/PRIVATE\n' +
        'Private services throughout.\n\n' +
        'ELEVATIONS\n' +
        'Cusco ~3,400 m; acclimatization days included.\n\n' +
        'ACCLIMATIZATION\n' +
        'Gradual ascent Lima → Cusco → Valley → MP.';
      setDescValue(selected.description ?? template);
    }
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      setMessageTemplateDraft({});
      return;
    }
    setMessageTemplateDraft(selected.messageTemplate ?? {});
  }, [selected?.id]);

  useEffect(() => {
    if (!messageTemplateOpen) return;
    setMessageTemplateSaved(false);
    setMessageTemplateError(null);
  }, [messageTemplateOpen, selected?.id]);

  useEffect(() => {
    if (!pendingScrollDayId) return;
    const el = dayRefs.current[pendingScrollDayId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScrollDayId(null);
    }
  }, [pendingScrollDayId, selected?.days.length]);

  const handleAddDay = () => {
    const id = b.addDay();
    if (id) setPendingScrollDayId(id);
  };

  const isEdgeDay = (dayId: string) => {
    if (!selected) return false;
    const idx = selected.days.findIndex((d) => d.id === dayId);
    return idx === 0 || idx === selected.days.length - 1;
  };

  const requestMoveDay = (dayId: string, dir: -1 | 1) => {
    if (isEdgeDay(dayId)) {
      setDayActionConfirm({ type: 'move', dayId, dir });
    } else {
      b.moveDay(dayId, dir);
    }
  };

  const requestDeleteDay = (dayId: string) => {
    if (isEdgeDay(dayId)) {
      setDayActionConfirm({ type: 'delete', dayId });
    } else {
      b.deleteDay(dayId);
    }
  };

  const confirmDayAction = () => {
    if (!dayActionConfirm) return;
    if (dayActionConfirm.type === 'move' && dayActionConfirm.dir) {
      b.moveDay(dayActionConfirm.dayId, dayActionConfirm.dir);
    } else if (dayActionConfirm.type === 'delete') {
      b.deleteDay(dayActionConfirm.dayId);
    }
    setDayActionConfirm(null);
  };

  useEffect(() => {
    if (crmView === 'pricing-library') {
      b.loadTemplateLibrary();
    }
  }, [crmView]);

  useEffect(() => {
    if (!templateModal || templateModal.mode !== 'edit') return;
    const t = b.templateLibrary.find((x) => x.id === templateModal.id);
    if (!t) return;
    setTemplateName(t.name);
    setTemplateKind(t.kind);
    setTemplateAmount(String(t.defaultAmountUsd ?? 0));
  }, [templateModal?.id]);

  const modalDay = lineModal?.dayId ? selected?.days.find((d) => d.id === lineModal.dayId) : null;
  const modalTitle =
    lineModal?.mode === 'day'
      ? `Add Line Item — Day ${modalDay?.dayNumber ?? ''}: ${modalDay?.title ?? ''}`
      : lineModal?.mode === 'fee'
        ? 'Add Additional Fee'
        : 'Add General Line Item';

  const feeItems = b.pricingGeneralItems.filter((i) => i.kind === 'fee');
  const baseGeneralItems = b.pricingGeneralItems.filter((i) => i.kind !== 'fee');
  const globalSubtotalUsd = baseGeneralItems.reduce((s, i) => s + i.amountUsd, 0);
  const feesSubtotalUsd = feeItems.reduce((s, i) => s + i.amountUsd, 0);
  const daySubtotalUsd = b.pricingDayItems.reduce((s, d) => s + d.items.reduce((t, i) => t + i.amountUsd, 0), 0);
  const totalPriceUsd = globalSubtotalUsd + feesSubtotalUsd + daySubtotalUsd;
  const dayItemsById = new Map(b.pricingDayItems.map((d) => [d.dayId, d.items]));
  const durationLabel = selected ? `${selected.days.length} Days / ${Math.max(selected.days.length - 1, 0)} Nights` : '';

  const mainContent = (() => {
    if (crmView === 'pricing-library') {
      const q = templateQuery.trim().toLowerCase();
      const templates = q
        ? b.templateLibrary.filter((t) => t.name.toLowerCase().includes(q) || t.sku.toLowerCase().includes(q))
        : b.templateLibrary;
      return (
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Pricing Library</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">All saved pricing templates with SKUs.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                onClick={() => setCrmView('itineraries')}
              >
                Back to Itineraries
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                onClick={() => setTemplateModal({ mode: 'create' })}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Template
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all" onClick={() => b.loadTemplateLibrary()}>
                Refresh
              </button>
            </div>
          </div>
          <label className="flex flex-col w-full">
            <div className="flex w-full items-stretch rounded-lg h-10 bg-[#f0f2f4] dark:bg-gray-800 focus-within:ring-2 ring-primary/50 transition-all">
              <div className="text-[#617589] dark:text-gray-400 flex items-center justify-center pl-3 pr-2">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="flex w-full bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#617589] dark:placeholder:text-gray-500 text-sm focus:ring-0 p-0"
                placeholder="Search templates..."
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
              />
            </div>
          </label>
          {b.templateLibraryLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading templates…</div>
          ) : templates.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No templates found.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1A2633] shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#f0f2f4] dark:bg-[#24303f] text-[#111418] dark:text-white font-medium border-b border-[#dbe0e6] dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 w-1/2">Item Name</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Default (USD)</th>
                    <th className="px-4 py-4 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                  {templates.map((t) => (
                    <tr key={t.id} className="group hover:bg-gray-50 dark:hover:bg-[#1e2a36] transition-colors">
                      <td className="px-6 py-3 text-[#111418] dark:text-white font-medium">{t.name}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{t.sku}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {t.kind}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-[#111418] dark:text-white">${t.defaultAmountUsd}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="text-gray-400 hover:text-[#111418] dark:hover:text-white transition-colors mr-2"
                          onClick={() => setTemplateModal({ mode: 'edit', id: t.id })}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          onClick={() => {
                            if (!window.confirm(`Delete template "${t.name}"? This will not delete existing line items.`)) return;
                            b.deletePricingTemplate(t.id);
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (!selected) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Please select an itinerary to begin
        </div>
      );
    }

    const kindBadgeClass = (kind: string) => {
      switch (kind) {
        case 'hotel':
          return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
        case 'activity':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
        case 'general':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        case 'fee':
          return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    };

    return (
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 z-30 w-full bg-white dark:bg-[#1A2633] border-b border-[#e5e7eb] dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3 w-full h-16 relative">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    className="bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary focus:ring-0 rounded px-1.5 -ml-1.5 py-0 text-lg font-bold text-[#111418] dark:text-white truncate leading-tight w-auto min-w-[200px] transition-all"
                    type="text"
                    value={tempTitle}
                    onChange={(e) => {
                      setTempTitle(e.target.value);
                      b.updateItineraryTitle(e.target.value);
                    }}
                    aria-label="Itinerary Name"
                  />
                  <span className="bg-primary/10 text-primary dark:bg-primary/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 select-none">
                    Draft
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium font-body mt-0.5">
                  ID: {selected.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isAdmin ? (
                <>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete Itinerary"
                    onClick={async () => {
                      const ok = window.confirm(
                        `Delete itinerary "${selected.title}"? This will remove all days and cannot be undone.`,
                      );
                      if (!ok) return;
                      await b.deleteItinerary(selected.id);
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                </>
              ) : null}
              <span
                className={`flex items-center gap-1.5 text-xs font-medium mr-1 ${
                  b.autosaveStatus === 'error' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                }`}
                title="Edits save automatically"
              >
                {b.autosaveStatus === 'saving' ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Saving…
                  </>
                ) : b.autosaveStatus === 'saved' ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                    Saved
                  </>
                ) : b.autosaveStatus === 'error' ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cloud_off</span>
                    Save failed
                  </>
                ) : null}
              </span>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                onClick={() => {
                  b.selectItinerary(selected.id);
                }}
              >
                Discard
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                onClick={async () => {
                  setPubOpen(true);
                  setPubDone(false);
                  setPubError(null);
                  setPubProgress(0);
                  try {
                    await b.publishWithProgress(descValue, (p) => setPubProgress(p));
                    setPubDone(true);
                  } catch (e: any) {
                    setPubError(e?.message || 'Failed to save edits.');
                  }
                }}
              >
                <span className="material-symbols-outlined text-[18px] fill-1">save</span>
                Save
              </button>
            </div>
          </div>
        </div>

        {(
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">
            <section className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Information</h3>
                <button
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  onClick={() => setMessageTemplateOpen(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Message Template
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Duration</label>
                  <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 border border-gray-200 dark:border-gray-700">
                    <span className="material-symbols-outlined text-gray-400 mr-2 text-[18px]">schedule</span>
                    <input className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white w-full p-0 focus:ring-0" type="text" value={durationLabel} readOnly />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Summary</label>
                <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden shadow-sm">
                  <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/80">
                    <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" title="Bold">
                      <span className="material-symbols-outlined text-[18px]">format_bold</span>
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" title="Italic">
                      <span className="material-symbols-outlined text-[18px]">format_italic</span>
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" title="Underline">
                      <span className="material-symbols-outlined text-[18px]">format_underlined</span>
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      className="block w-full text-sm text-gray-600 dark:text-gray-300 bg-transparent border-none focus:ring-0 p-3 pb-6 resize-y min-h-[120px]"
                      placeholder="Enter a brief summary of the trip..."
                      rows={4}
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#1A2633] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#1e2a36] transition-colors"
                onClick={() => setPricingPanelOpen((o) => !o)}
                aria-expanded={pricingPanelOpen}
              >
                <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  Pricing Overview
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total / person:{' '}
                    <span className="font-bold text-[#111418] dark:text-white">${totalPriceUsd.toLocaleString()}</span>
                  </span>
                  <span className="material-symbols-outlined text-gray-400 transition-transform" style={{ transform: pricingPanelOpen ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </div>
              </button>
              {pricingPanelOpen ? (
                <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center gap-2 p-6 bg-white dark:bg-[#1A2633] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">tune</span>
                          Matrix Controls
                        </h3>
                        {isAdmin ? (
                          <button
                            className="inline-flex items-center gap-2 rounded-lg border border-[#dbe0e6] dark:border-gray-700 px-3 py-2 text-sm font-medium text-[#111418] dark:text-gray-100 hover:bg-[#f7f8fa] dark:hover:bg-gray-800 transition-colors"
                            onClick={() => {
                              setImpJson(null);
                              setImpError(null);
                              setImportTitleConflict(null);
                              setImpOpen(true);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Import Pricing
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex bg-[#f0f2f4] dark:bg-[#24303f] p-1 rounded-lg">
                          {(['3', '4', '5', 'deluxe'] as const).map((lv) => (
                            <label className="cursor-pointer" key={lv}>
                              <input
                                className="peer sr-only"
                                name="level"
                                type="radio"
                                checked={b.pricingLevel === lv}
                                onChange={() => b.setPricingLevel(lv)}
                              />
                              <span className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:bg-white/50 dark:hover:bg-gray-700 peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-primary peer-checked:shadow-sm flex items-center gap-2">
                                {lv === 'deluxe' ? 'Deluxe' : `${lv} Star`}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="flex bg-[#f0f2f4] dark:bg-[#24303f] p-1 rounded-lg">
                          {(['single', 'double', 'triple'] as const).map((occ) => (
                            <label className="cursor-pointer" key={occ}>
                              <input
                                className="peer sr-only"
                                name="occupancy"
                                type="radio"
                                checked={b.pricingOccupancy === occ}
                                onChange={() => b.setPricingOccupancy(occ)}
                              />
                              <span className="px-4 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:bg-white/50 dark:hover:bg-gray-700 peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-primary peer-checked:shadow-sm flex items-center gap-2">
                                {occ.charAt(0).toUpperCase() + occ.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 flex flex-col justify-between rounded-xl p-6 bg-primary text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 size-32 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10">
                        <p className="text-primary-50 text-sm font-medium leading-normal mb-1">Total Price Per Person</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-4xl font-bold leading-tight tracking-tight">${totalPriceUsd.toLocaleString()}</p>
                          <span className="text-lg opacity-80">.00</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center relative z-10">
                        <span className="text-xs font-medium text-primary-100 uppercase tracking-wider">Day Subtotal</span>
                        <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded text-sm">${daySubtotalUsd.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Global Costs</h3>
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        onClick={() => {
                          setLineModal({ mode: 'general' });
                          setLineName('');
                          setLineAmount('0');
                          setLineSaveTemplate(false);
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Add Item
                      </button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1A2633] shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#f0f2f4] dark:bg-[#24303f] text-[#111418] dark:text-white font-medium border-b border-[#dbe0e6] dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-4 w-1/2">Item Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Cost (USD)</th>
                            <th className="px-4 py-4 w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                          {baseGeneralItems.map((item) => (
                            <PricingTableRow
                              key={item.id}
                              item={item}
                              badgeClassName={kindBadgeClass(item.kind)}
                              badgeLabel={item.kind}
                              onSave={(patch) => b.updateGeneralLineItem(item.id, patch)}
                              onDelete={() => b.deleteGeneralLineItem(item.id)}
                            />
                          ))}
                        </tbody>
                      </table>
                      <div className="bg-[#fcfdfd] dark:bg-[#1A2633] p-3 border-t border-[#dbe0e6] dark:border-gray-700 flex justify-end">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Subtotal Global: <span className="font-bold text-[#111418] dark:text-white ml-1">${globalSubtotalUsd}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Additional Fees</h3>
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        onClick={() => {
                          setLineModal({ mode: 'fee' });
                          setLineName('');
                          setLineAmount('0');
                          setLineSaveTemplate(false);
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Add Fee
                      </button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1A2633] shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#f0f2f4] dark:bg-[#24303f] text-[#111418] dark:text-white font-medium border-b border-[#dbe0e6] dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-4 w-1/2">Item Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Cost (USD)</th>
                            <th className="px-4 py-4 w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                          {feeItems.map((item) => (
                            <PricingTableRow
                              key={item.id}
                              item={item}
                              badgeClassName={kindBadgeClass(item.kind)}
                              badgeLabel={item.kind}
                              onSave={(patch) => b.updateGeneralLineItem(item.id, patch)}
                              onDelete={() => b.deleteGeneralLineItem(item.id)}
                            />
                          ))}
                          {feeItems.length === 0 ? (
                            <tr>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                                No additional fees added yet.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                      <div className="bg-[#fcfdfd] dark:bg-[#1A2633] p-3 border-t border-[#dbe0e6] dark:border-gray-700 flex justify-end">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Subtotal Fees: <span className="font-bold text-[#111418] dark:text-white ml-1">${feesSubtotalUsd}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Itinerary</h3>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#f0f2f4] dark:bg-[#24303f] text-gray-600 dark:text-gray-300 hover:text-[#111418] dark:hover:text-white hover:bg-[#e7eaee] dark:hover:bg-[#2c3a4b] transition-colors select-none"
                    onClick={() => flipAll(!allFlipped)}
                    title={allFlipped ? 'Show details for every day' : 'Show pricing for every day'}
                  >
                    <span className="material-symbols-outlined text-[18px]">flip</span>
                    {allFlipped ? 'Show All Details' : 'Show All Pricing'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => {
                      setDayLibraryOpen(true);
                      setDayLibraryResults([]);
                      setDayLibraryQuery('');
                    }}
                  >
                    Add Saved Day
                  </button>
                  <span className="text-gray-300">|</span>
                  <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" onClick={handleAddDay}>
                    Add Day
                  </button>
                </div>
              </div>

              {selected.days.map((day, idx) => {
                const flipped = !!pricingFlips[day.id];
                const dayItems = dayItemsById.get(day.id) ?? [];
                const daySubtotal = dayItems.reduce((s, i) => s + i.amountUsd, 0);
                const isFirst = idx === 0;
                const isLast = idx === selected.days.length - 1;
                return (
                <article
                  key={day.id}
                  ref={(el) => {
                    dayRefs.current[day.id] = el;
                  }}
                  className={`bg-white dark:bg-background-dark rounded-xl shadow-sm border transition-all hover:shadow-md group/card ${
                    flipped ? 'border-primary/40 dark:border-primary/40' : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`size-8 rounded-full shrink-0 ${idx === 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'} flex items-center justify-center font-bold text-sm`}>
                        {day.dayNumber}
                      </div>
                      <div className="flex-1">
                        <input
                          className="w-full text-left text-lg font-bold text-gray-900 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 p-0 transition-colors placeholder:text-gray-400"
                          placeholder="Enter day title..."
                          type="text"
                          value={day.title}
                          onChange={(e) => b.updateDay(day.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            flipped
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => setPricingFlips((prev) => ({ ...prev, [day.id]: !prev[day.id] }))}
                          title={flipped ? 'Show day details' : 'Show day pricing'}
                        >
                          <span className="material-symbols-outlined text-[16px]">{flipped ? 'description' : 'payments'}</span>
                          {flipped ? 'Details' : 'Pricing'}
                        </button>
                        <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            onClick={() => requestMoveDay(day.id, -1)}
                            disabled={isFirst}
                            title="Move day up"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            onClick={() => requestMoveDay(day.id, 1)}
                            disabled={isLast}
                            title="Move day down"
                          >
                            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                            onClick={() => requestDeleteDay(day.id)}
                            title="Delete day"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    {!flipped ? (
                    <>
                    <div className="mb-6">
                      <AutoGrowTextarea
                        className="w-full text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-transparent focus:border-primary focus:ring-0 resize-none p-3 overflow-hidden block"
                        placeholder="Describe the day's activities..."
                        minRows={3}
                        value={day.description}
                        onChange={(v) => b.updateDay(day.id, { description: v })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-100 dark:border-gray-800/50 flex gap-3">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-md h-fit shrink-0 shadow-sm text-gray-500 dark:text-gray-300">
                          <span className="material-symbols-outlined text-[18px]">directions_car</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Transfers</label>
                          <input
                            className="bg-transparent border-none p-0 w-full text-sm font-medium text-gray-900 dark:text-white focus:ring-0 truncate"
                            type="number"
                            min={0}
                            value={day.transferCount}
                            onChange={(e) => b.updateDay(day.id, { transferCount: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-100 dark:border-gray-800/50 flex gap-3">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-md h-fit shrink-0 shadow-sm text-gray-500 dark:text-gray-300">
                          <span className="material-symbols-outlined text-[18px]">hotel</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Accommodation</label>
                          <input
                            className="bg-transparent border-none p-0 w-full text-sm font-medium text-gray-900 dark:text-white focus:ring-0 truncate"
                            type="text"
                            value={day.hotelName ?? ''}
                            onChange={(e) => b.updateDay(day.id, { hotelName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-100 dark:border-gray-800/50 flex gap-3">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-md h-fit shrink-0 shadow-sm text-gray-500 dark:text-gray-300">
                          <span className="material-symbols-outlined text-[18px]">bed</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Room Type</label>
                          <input
                            className="bg-transparent border-none p-0 w-full text-sm font-medium text-gray-900 dark:text-white focus:ring-0 truncate"
                            type="text"
                            value={day.accommodationLevel}
                            onChange={(e) => b.updateDay(day.id, { accommodationLevel: e.target.value as any })}
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-100 dark:border-gray-800/50 flex gap-3">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-md h-fit shrink-0 shadow-sm text-gray-500 dark:text-gray-300">
                          <span className="material-symbols-outlined text-[18px]">restaurant</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Destination</label>
                          <input
                            className="bg-transparent border-none p-0 w-full text-sm font-medium text-gray-900 dark:text-white focus:ring-0 truncate"
                            type="text"
                            value={day.destination}
                            onChange={(e) => b.updateDay(day.id, { destination: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    </>
                    ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                          Day {day.dayNumber} Pricing
                        </h4>
                        <button
                          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          onClick={() => {
                            setLineModal({ mode: 'day', dayId: day.id });
                            setLineName('');
                            setLineAmount('0');
                            setLineSaveTemplate(false);
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">add_circle</span>
                          Add Line Item
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1A2633] shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#f0f2f4] dark:bg-[#24303f] text-[#111418] dark:text-white font-medium border-b border-[#dbe0e6] dark:border-gray-700">
                            <tr>
                              <th className="px-6 py-3 w-1/2">Item Name</th>
                              <th className="px-6 py-3">Category</th>
                              <th className="px-6 py-3 text-right">Cost (USD)</th>
                              <th className="px-4 py-3 w-[60px]"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                            {dayItems.map((item) => (
                              <PricingTableRow
                                key={item.id}
                                item={item}
                                badgeClassName={kindBadgeClass(item.kind)}
                                badgeLabel={item.kind}
                                onSave={(patch) => b.updateDayLineItem(day.id, item.id, patch)}
                                onDelete={() => b.deleteDayLineItem(day.id, item.id)}
                              />
                            ))}
                            {dayItems.length === 0 ? (
                              <tr>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={4}>
                                  No pricing line items for this day yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                        <div className="bg-[#fcfdfd] dark:bg-[#1A2633] p-3 border-t border-[#dbe0e6] dark:border-gray-700 flex justify-end">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Day Subtotal: <span className="font-bold text-[#111418] dark:text-white ml-1">${daySubtotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                </article>
                );
              })}

              <button
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all group"
                onClick={handleAddDay}
              >
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="font-bold text-sm">Add Day {selected.days.length + 1}</span>
              </button>
            </div>
            <div className="h-12"></div>
          </div>
        )}
      </div>
    );
  })();

  const coverImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAKJ-i4SN_SpO0QHbmqXnGDo8TGQnmHfCi8qAc48M5RNBpW5V3v1Q-5tvAvr3EAMGQOYK8YJ0RUmnnypMbqgb97tnR0iRGB9mAeA5sfL0BWJeEafUXBnjPJTjI9h96b4SVZCcW6Qd_Fkc6FD6pq3EQfonKs3kKRvm4bi1zX0bHvNQDc4yoYyW_rFREAHWkxhcO92GwB7qIhmk71cMZ371AOan4rim1NoMgb57ygZkkC_g_LEQtQXMT3nfuIrSppvAKKZ7uVe0P_h9Y',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA6QchLZc8ZJJIV6QlIqZWNokylPmOI69yr8tny5RxMClprC2fPXRblK_GiwXo1o_S-CxwyRnhuLyXQuJ2jU63orrlEjaIecriSz96if3wRhQFJKKplOepOhpj8Kdr17T0CzSCx1xbMpdm6FwegmISO3VTclKMehZhcUyESAi5HrzT5R3JcPXrR0cZi3xbdC-ahQY4DdJ5avBF4RX8ezu0beFZ-U-uWFXl4wxQWOqKawOzdu1X8yrltPtJMr2QTVK_7M3PxI9a-TZs',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBGkKhqdNYAqAMj-f-ducfFXvODls1ZmOqtyHw146iJ22Gl0qDxsnBiYlDs5b0X8B14k6UyeqHCR8Gh7qFWR-7tUazndJExPw10vqz-xFU19mSGHoPeUagzG-cngcuaDnNjSq3FAWdEPRdVWsQzTMZD8gfME5Je26-SAiVJDehkeeFD_MWpAkIHmjiuwurbMgTXEgDw1NJfr4Bx2w1jUZaDY0234Dc8L-bxpCmIXAYyZaymvyGG9La8kWhge1WHzbgxrIpLqau2Ubs',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBe5DU3cGSgYDaSjs4Q-ZEwcGiJCAOUKVQ6fLxtuiunFRl-VDZUBnNEFb9gZluI8GjrZlwVG8jhxLGtju47jgAIc3dFntl4q7snsJGwiNw6iz-qp_xBd1IuA5mGRkeBa6Z-XyUi1za97mtjePtv1h7GJQ98o_vjhf1HXy8WCSXXa4Wt7B4RuBtO_M2gKe4YKlIdfeO7fkQ2G9u4J1Q7Ckai793wjssMQX1dJ9fUJ12SPxz1D2RWBJL6UuXDSYoMcXIwWZxeNe64POI',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBo42eFvQ1TP6mEuFEjOb1hzD_q7-Xek8l-biHMkM0LBdFk7NS425godYVZeUgrp_W6vLcKnvJz29Yb2ogQ3u1Usa0UzUnn0oB6_eYM-p5HY71w1AR8-2hjviDn9ynC-oJ9dbJQfcpYksah7hUQS2m6a0c8AUtPlUhFClFHcNredf_vxaAx-0a7G0XVh31GXHpgrYaljdFBchViFDFVB74_tu7SsKz6rcHgl0iQEnvDDqTJO_fUldGtu7by19C-NWxEZtBASy-4EKc',
  ];

  return (
    <StitchShell active="itineraries">
      {crmView === 'itineraries' ? (
        <aside
          className={`relative flex flex-col bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 shrink-0 z-10 hidden lg:flex transition-all duration-200 ${
            isListOpen ? 'w-[400px]' : 'w-4'
          }`}
        >
          <button
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-full w-6 h-6 text-xs shadow"
            onClick={() => setIsListOpen((s) => !s)}
            aria-label={isListOpen ? 'Collapse itineraries list' : 'Expand itineraries list'}
          >
            {isListOpen ? '›' : '‹'}
          </button>
          {isListOpen ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
                <label className="flex flex-col w-full">
                  <div className="flex w-full items-stretch rounded-lg h-10 bg-[#f0f2f4] dark:bg-gray-800 focus-within:ring-2 ring-primary/50 transition-all">
                    <div className="text-[#617589] dark:text-gray-400 flex items-center justify-center pl-3 pr-2">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      className="flex w-full bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#617589] dark:placeholder:text-gray-500 text-sm focus:ring-0 p-0"
                      placeholder="Search itineraries..."
                      value={b.query}
                      onChange={(e) => b.setQuery(e.target.value)}
                    />
                  </div>
                </label>
                <div className="flex gap-2">
                  <button
                    className="flex-1 cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-primary hover:bg-blue-600 text-white text-sm font-bold tracking-[0.015em] transition-colors flex gap-2"
                    onClick={() => setNewItinOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span className="truncate">New</span>
                  </button>
                  {isAdmin ? (
                    <button
                      className="flex-1 cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-[#f0f2f4] hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold tracking-[0.015em] transition-colors flex gap-2"
                      onClick={() => setImpOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      <span className="truncate">Import</span>
                    </button>
                  ) : null}
                </div>
                <button
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => setCrmView('pricing-library')}
                >
                  Open Pricing Library
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {b.items.map((it, idx) => {
                  const selectedRow = b.selectedId === it.id;
                  return (
                    <div
                      key={it.id}
                      className={`group flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                        selectedRow
                          ? 'bg-blue-50 dark:bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent border-b border-gray-100 dark:border-gray-800/50'
                      }`}
                      onClick={() => {
                        setPendingId(it.id);
                        setShowWarning(true);
                      }}
                    >
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-12 shrink-0 shadow-sm"
                        style={{ backgroundImage: `url("${coverImages[idx % coverImages.length]}")` }}
                      ></div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-[#111418] dark:text-white text-sm font-bold leading-tight line-clamp-1">{it.title}</p>
                          <span className={`text-xs font-semibold ml-2 ${selectedRow ? 'text-primary dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            ${it.totalPriceUsd ?? 0}
                          </span>
                        </div>
                        <p className="text-[#617589] dark:text-gray-400 text-xs font-normal leading-normal mt-1 line-clamp-1">
                          {it.days.length} Days • TBD Pax
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1" />
          )}
        </aside>
      ) : null}

      <div className="flex-1 flex flex-col bg-background-light dark:bg-[#0b1219] min-w-0 relative">{mainContent}</div>

      <WarningModal
        open={showWarning}
        onClose={() => setShowWarning(false)}
        onEdit={() => {
          if (pendingId) {
            b.selectItinerary(pendingId);
          }
        }}
        onDuplicate={() => {
          b.duplicateFrom(pendingId);
        }}
      />
      <PublishModal
        open={pubOpen}
        progress={pubProgress}
        done={pubDone}
        error={pubError}
        onClose={() => {
          setPubOpen(false);
          setPubDone(false);
          setPubError(null);
          setPubProgress(0);
        }}
      />
      <NewItineraryModal
        open={newItinOpen}
        onClose={() => setNewItinOpen(false)}
        onCreateBlank={(opts) => void b.createItineraryBlank(opts)}
        onChooseImport={() => {
          setNewItinOpen(false);
          setImpOpen(true);
        }}
        duplicateItems={b.items.map((it) => ({ id: it.id, title: it.title }))}
        onDuplicateFrom={(id) => void b.duplicateFrom(id)}
      />
      <ImportTitleConflictModal
        open={!!importTitleConflict}
        conflict={importTitleConflict}
        loading={impLoading}
        onMerge={() => void runImportWithResolution('merge_into_existing', importTitleConflict?.existingItinerary.id)}
        onCreateNew={() => void runImportWithResolution('create_new')}
        onCancel={() => setImportTitleConflict(null)}
      />
      <ImportModal
        open={impOpen}
        loading={impLoading}
        error={impError}
        hasJson={!!impJson}
        onPickFile={async (file) => {
          try {
            setImpError(null);
            setImpLoading(true);
            const lower = file.name.toLowerCase();
            if (lower.endsWith('.xlsx')) {
              const { parseExcelToItineraryImport } = await import('../utils/excelItineraryImport');
              const json = await parseExcelToItineraryImport(file);
              setImpJson(json);
            } else {
              const text = await file.text();
              const json = JSON.parse(text);
              setImpJson(json);
            }
          } catch (e: any) {
            setImpError(e?.message || 'Failed to read or parse file.');
            setImpJson(null);
          } finally {
            setImpLoading(false);
          }
        }}
        onImport={async () => {
          if (!impJson) return;
          try {
            setImpLoading(true);
            await b.importItinerariesFromJson(impJson);
            setImpOpen(false);
            setImpJson(null);
            setImpError(null);
            setImportTitleConflict(null);
          } catch (e: unknown) {
            if (e instanceof ImportTitleConflictError) {
              setImportTitleConflict(e.conflict);
              setImpError(null);
            } else {
              setImpError(e instanceof Error ? e.message : 'Import failed.');
            }
          } finally {
            setImpLoading(false);
          }
        }}
        onClose={() => {
          setImpOpen(false);
          setImpJson(null);
          setImpError(null);
          setImpLoading(false);
          setImportTitleConflict(null);
        }}
      />
      <LineItemModal
        open={!!lineModal}
        title={modalTitle}
        showSaveTemplate={lineModal?.mode === 'day'}
        templates={b.pricingTemplates}
        name={lineName}
        amount={lineAmount}
        saveTemplate={lineSaveTemplate}
        onSelectTemplate={(templateId) => {
          const t = b.pricingTemplates.find((p) => p.id === templateId);
          if (!t) return;
          setLineName(t.name);
          setLineAmount(String(t.amountUsd ?? t.defaultAmountUsd ?? 0));
        }}
        onChangeName={setLineName}
        onChangeAmount={setLineAmount}
        onChangeSaveTemplate={setLineSaveTemplate}
        onCancel={() => {
          setLineModal(null);
          setLineName('');
          setLineAmount('0');
          setLineSaveTemplate(false);
        }}
        onSave={async () => {
          const name = lineName.trim();
          if (!name) return;
          const amountUsd = toUsd(lineAmount);
          if (lineModal?.mode === 'general') {
            await b.addGeneralLineItem({ name, amountUsd });
          } else if (lineModal?.mode === 'fee') {
            await b.addGeneralLineItem({ name, amountUsd, kind: 'fee' });
          } else if (lineModal?.mode === 'day' && lineModal.dayId) {
            let templateId: string | null | undefined = undefined;
            if (lineSaveTemplate) {
              const template = await b.createPricingTemplate({ name, kind: 'custom', amountUsd });
              templateId = template.id;
            }
            await b.addDayLineItem(lineModal.dayId, { name, amountUsd, templateId, saveTemplate: lineSaveTemplate });
          }
          setLineModal(null);
          setLineName('');
          setLineAmount('0');
          setLineSaveTemplate(false);
        }}
      />
      <DayLibraryModal
        open={dayLibraryOpen}
        query={dayLibraryQuery}
        loading={dayLibraryLoading}
        results={dayLibraryResults}
        onQueryChange={setDayLibraryQuery}
        onSearch={async () => {
          try {
            setDayLibraryLoading(true);
            const res = await b.searchDayLibrary(dayLibraryQuery);
            setDayLibraryResults(res);
          } finally {
            setDayLibraryLoading(false);
          }
        }}
        onSelect={async (id) => {
          await b.cloneDayFromLibrary(id);
          setDayLibraryOpen(false);
          setDayLibraryResults([]);
          setDayLibraryQuery('');
        }}
        onClose={() => {
          setDayLibraryOpen(false);
          setDayLibraryResults([]);
          setDayLibraryQuery('');
        }}
      />
      <TemplateModal
        open={!!templateModal}
        mode={templateModal?.mode ?? 'create'}
        name={templateName}
        sku={templateModal?.mode === 'edit' ? b.templateLibrary.find((t) => t.id === templateModal?.id)?.sku : undefined}
        kind={templateKind}
        amount={templateAmount}
        onChangeName={setTemplateName}
        onChangeKind={setTemplateKind}
        onChangeAmount={setTemplateAmount}
        onCancel={() => {
          setTemplateModal(null);
          setTemplateName('');
          setTemplateKind('custom');
          setTemplateAmount('0');
        }}
        onSave={async () => {
          const name = templateName.trim();
          if (!name) return;
          const defaultAmountUsd = toUsd(templateAmount);
          if (templateModal?.mode === 'create') {
            await b.createTemplateLibrary({ name, kind: templateKind, amountUsd: defaultAmountUsd });
          } else if (templateModal?.mode === 'edit' && templateModal.id) {
            await b.updatePricingTemplate(templateModal.id, {
              name,
              kind: templateKind,
              defaultAmountUsd,
            });
          }
          setTemplateModal(null);
          setTemplateName('');
          setTemplateKind('custom');
          setTemplateAmount('0');
        }}
      />
      {messageTemplateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMessageTemplateOpen(false)} />
          <div className="relative w-[95vw] max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Itinerary Message Template</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Stored per itinerary and used to generate proposal messaging. Placeholders supported: {'{{clientName}}'}, {'{{itineraryName}}'},
                  {'{{startDate}}'}, {'{{flightPricing}}'}, {'{{discountPercentage}}'}, {'{{discountDeadline}}'}.
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setMessageTemplateOpen(false)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Greeting</span>
                  {renderPlaceholderSelect((token) =>
                    updateMessageTemplate({
                      greeting: insertToken(messageTemplateDraft.greeting ?? '', token, greetingRef.current),
                    }),
                  )}
                </div>
                <input
                  ref={greetingRef}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={messageTemplateDraft.greeting ?? ''}
                  onChange={(e) => updateMessageTemplate({ greeting: e.target.value })}
                  placeholder="Dear {{clientName}},"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">General Message</span>
                  {renderPlaceholderSelect((token) =>
                    updateMessageTemplate({
                      generalMessage: insertToken(messageTemplateDraft.generalMessage ?? '', token, generalMessageRef.current),
                    }),
                  )}
                </div>
                <textarea
                  ref={generalMessageRef}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                  value={messageTemplateDraft.generalMessage ?? ''}
                  onChange={(e) => updateMessageTemplate({ generalMessage: e.target.value })}
                  placeholder="Set the overall tone or summary for this itinerary."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Key Package Details</span>
                  {renderPlaceholderSelect((token) =>
                    updateMessageTemplate({
                      keyDetails: insertToken(messageTemplateDraft.keyDetails ?? '', token, keyDetailsRef.current),
                    }),
                  )}
                </div>
                <textarea
                  ref={keyDetailsRef}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
                  value={messageTemplateDraft.keyDetails ?? ''}
                  onChange={(e) => updateMessageTemplate({ keyDetails: e.target.value })}
                  placeholder="Highlight the standout experiences, hotels, or transportation details."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Cabin Availability</span>
                    {renderPlaceholderSelect((token) =>
                      updateMessageTemplate({
                        cabinAvailability: insertToken(
                          messageTemplateDraft.cabinAvailability ?? '',
                          token,
                          cabinAvailabilityRef.current,
                        ),
                      }),
                    )}
                  </div>
                  <input
                    ref={cabinAvailabilityRef}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={messageTemplateDraft.cabinAvailability ?? ''}
                    onChange={(e) => updateMessageTemplate({ cabinAvailability: e.target.value })}
                    placeholder="e.g., Limited balcony cabins available."
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Flight Pricing</span>
                    {renderPlaceholderSelect((token) =>
                      updateMessageTemplate({
                        flightPricing: insertToken(messageTemplateDraft.flightPricing ?? '', token, flightPricingRef.current),
                      }),
                    )}
                  </div>
                  <input
                    ref={flightPricingRef}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={messageTemplateDraft.flightPricing ?? ''}
                    onChange={(e) => updateMessageTemplate({ flightPricing: e.target.value })}
                    placeholder="e.g., Flights from $1,250 per person."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">Discounts</h4>
                  <button className="text-xs font-semibold text-primary hover:underline" onClick={addDiscount}>
                    Add Discount
                  </button>
                </div>
                {messageTemplateDraft.discounts && messageTemplateDraft.discounts.length ? (
                  messageTemplateDraft.discounts.map((discount, idx) => (
                    <div key={`${discount.label}-${idx}`} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            ref={(node) => {
                              discountLabelRefs.current[idx] = node;
                            }}
                            className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm"
                            value={discount.label ?? ''}
                            onChange={(e) => updateDiscount(idx, { label: e.target.value })}
                            placeholder="Discount label"
                          />
                          {renderPlaceholderSelect((token) =>
                            updateDiscount(idx, {
                              label: insertToken(discount.label ?? '', token, discountLabelRefs.current[idx]),
                            }),
                          )}
                        </div>
                        <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => removeDiscount(idx)}>
                          Remove
                        </button>
                      </div>
                      <textarea
                        ref={(node) => {
                          discountMessageRefs.current[idx] = node;
                        }}
                        className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm min-h-[60px]"
                        value={discount.message ?? ''}
                        onChange={(e) => updateDiscount(idx, { message: e.target.value })}
                        placeholder="Discount message (optional)"
                      />
                      <div className="flex items-center justify-end">
                        {renderPlaceholderSelect((token) =>
                          updateDiscount(idx, {
                            message: insertToken(discount.message ?? '', token, discountMessageRefs.current[idx]),
                          }),
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          Start Date
                          <input
                            type="date"
                            className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                            value={discount.startDate ?? ''}
                            onChange={(e) => updateDiscount(idx, { startDate: e.target.value || null })}
                          />
                        </label>
                        <label className="text-xs text-gray-500 flex flex-col gap-1">
                          End Date
                          <input
                            type="date"
                            className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                            value={discount.endDate ?? ''}
                            onChange={(e) => updateDiscount(idx, { endDate: e.target.value || null })}
                          />
                        </label>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No discounts added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Inclusions (one per line)</span>
                    {renderPlaceholderSelect((token) => {
                      const current = toLines(messageTemplateDraft.inclusions);
                      const next = insertToken(current, token, inclusionsRef.current);
                      updateMessageTemplate({ inclusions: fromLines(next) });
                    })}
                  </div>
                  <textarea
                    ref={inclusionsRef}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                    value={toLines(messageTemplateDraft.inclusions)}
                    onChange={(e) => updateMessageTemplate({ inclusions: fromLines(e.target.value) })}
                    placeholder="Airport transfers\nDaily breakfast\nCity tour"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Exclusions (one per line)</span>
                    {renderPlaceholderSelect((token) => {
                      const current = toLines(messageTemplateDraft.exclusions);
                      const next = insertToken(current, token, exclusionsRef.current);
                      updateMessageTemplate({ exclusions: fromLines(next) });
                    })}
                  </div>
                  <textarea
                    ref={exclusionsRef}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                    value={toLines(messageTemplateDraft.exclusions)}
                    onChange={(e) => updateMessageTemplate({ exclusions: fromLines(e.target.value) })}
                    placeholder="Travel insurance\nMeals not listed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <div className="flex-1">
                {messageTemplateSaving ? (
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-primary animate-pulse" style={{ width: '65%' }}></div>
                  </div>
                ) : messageTemplateError ? (
                  <div className="text-xs text-red-600">{messageTemplateError}</div>
                ) : messageTemplateSaved ? (
                  <div className="text-xs text-green-600">Template saved to this itinerary.</div>
                ) : null}
              </div>
              <button className="px-3 py-2 text-sm rounded-md border" onClick={() => setMessageTemplateOpen(false)}>
                Cancel
              </button>
              <button
                className="px-3 py-2 text-sm rounded-md bg-primary text-white hover:bg-blue-600 disabled:opacity-60"
                disabled={messageTemplateSaving}
                onClick={async () => {
                  if (!selected?.id) return;
                  setMessageTemplateSaving(true);
                  setMessageTemplateError(null);
                  setMessageTemplateSaved(false);
                  try {
                    b.updateItineraryMessageTemplate(messageTemplateDraft);
                    await b.saveItineraryMessageTemplate(messageTemplateDraft);
                    setMessageTemplateSaved(true);
                  } catch (e: any) {
                    setMessageTemplateError(e?.message || 'Failed to save template.');
                  } finally {
                    setMessageTemplateSaving(false);
                  }
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {dayActionConfirm && selected
        ? (() => {
            const idx = selected.days.findIndex((d) => d.id === dayActionConfirm.dayId);
            const day = selected.days[idx];
            const position = idx === 0 ? 'first' : 'last';
            const actionLabel =
              dayActionConfirm.type === 'delete'
                ? 'delete'
                : dayActionConfirm.dir === -1
                  ? 'move up'
                  : 'move down';
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setDayActionConfirm(null)} aria-hidden="true" />
                <div className="relative w-[95vw] max-w-md rounded-lg bg-white dark:bg-[#1A2633] p-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-[28px]">warning</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {dayActionConfirm.type === 'delete' ? 'Delete this day?' : 'Move this day?'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        You are about to {actionLabel} <span className="font-semibold">Day {day?.dayNumber}{day?.title ? ` — ${day.title}` : ''}</span>, which is the {position} day of this itinerary. Please confirm you want to make this change.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                      onClick={() => setDayActionConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                        dayActionConfirm.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                      }`}
                      onClick={confirmDayAction}
                    >
                      {dayActionConfirm.type === 'delete' ? 'Delete Day' : 'Confirm Move'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </StitchShell>
  );
}


