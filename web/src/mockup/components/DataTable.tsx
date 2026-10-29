import type { ReactNode } from 'react';

export default function DataTable({
  columns,
  rows,
  empty,
  onRowClick,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
  onRowClick?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto cmd-scroll">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-widest text-[#d5e2f2]">
            {columns.map((c) => (
              <th key={c} className="font-semibold pb-2 pr-3 border-b border-[rgba(19,127,236,0.2)]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-[#d5e2f2]">
                {empty ?? 'No records.'}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className={`cmd-hover-row border-b border-[rgba(19,127,236,0.1)] last:border-0 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(i) : undefined}
              >
                {row.map((cell, j) => (
                  <td key={j} className="py-2.5 pr-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
