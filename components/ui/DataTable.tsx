"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  selectable?: boolean;
  rowActions?: (row: T) => Array<{ label: string; onClick: () => void }>;
};

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  pageSize = 8,
  selectable = true,
  rowActions,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [openMenuFor, setOpenMenuFor] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageData = data.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  React.useEffect(() => {
    setPage(pageSafe);
  }, [pageSafe]);

  const allOnPageSelected =
    selectable &&
    pageData.length > 0 &&
    pageData.every((row) => selected[rowKey(row)]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              {selectable ? (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelected((prev) => {
                        const next = { ...prev };
                        pageData.forEach((row) => {
                          next[rowKey(row)] = checked;
                        });
                        return next;
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                    aria-label="Select all"
                  />
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500",
                    c.headerClassName,
                  )}
                >
                  {c.header}
                </th>
              ))}
              {rowActions ? <th className="w-12 px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row) => {
              const id = rowKey(row);
              const actions = rowActions?.(row) ?? [];
              const menuOpen = openMenuFor === id;

              return (
                <tr
                  key={id}
                  className={cn(
                    "h-12 border-b border-slate-100 transition-colors hover:bg-gray-50",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable ? (
                    <td className="px-4">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[id])}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [id]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  ) : null}

                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-4 py-3 text-sm text-gray-700", c.className)}
                    >
                      {c.cell(row)}
                    </td>
                  ))}

                  {rowActions ? (
                    <td className="relative px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFor((prev) => (prev === id ? null : id));
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                        aria-label="Row actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {menuOpen ? (
                        <div
                          className="absolute right-4 top-10 z-10 min-w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions.length ? (
                            actions.map((a) => (
                              <button
                                key={a.label}
                                type="button"
                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  a.onClick();
                                }}
                              >
                                {a.label}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No actions
                            </div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm text-gray-600">
          Page <span className="font-medium text-gray-900">{pageSafe}</span> of{" "}
          <span className="font-medium text-gray-900">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe === 1}
          >
            Previous
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: totalPages }).slice(0, 10).map((_, idx) => {
              const p = idx + 1;
              const active = p === pageSafe;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-9 min-w-9 rounded-lg px-3 text-sm font-medium",
                    active
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
