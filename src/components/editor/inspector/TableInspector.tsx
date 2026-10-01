"use client";

import { useTableActions } from "@/hooks/use-inspector-actions";
import type { TableElement } from "@/lib/deck/types";
import { CommitField } from "./CommitField";
import { InspectorHeader } from "./InspectorHeader";
import { FIELD, SECONDARY } from "./styles";

export function TableInspector({ table }: { table: TableElement }) {
  const actions = useTableActions(table);

  return (
    <>
      <InspectorHeader title="Table">
        <button type="button" onClick={actions.addRow} className={SECONDARY}>
          Add row
        </button>
        <button type="button" onClick={actions.addColumn} className={SECONDARY}>
          Add column
        </button>
      </InspectorHeader>
      <div className="min-h-0 overflow-auto px-4 pb-4">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={col.id} className="p-1">
                  <CommitField
                    value={col.header}
                    onCommit={(text) => actions.setHeader(i, text)}
                    aria-label="Column header"
                    className={`${FIELD} w-40 font-medium`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={row.id}>
                {row.cells.map((value, c) => (
                  <td key={table.columns[c]?.id ?? c} className="p-1">
                    <CommitField
                      value={value}
                      onCommit={(text) => actions.setCell(r, c, text)}
                      aria-label={table.columns[c]?.header}
                      className={`${FIELD} w-40`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
