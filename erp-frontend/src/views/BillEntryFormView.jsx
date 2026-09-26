import BillItemsTable from "../components/shared/BillItemsTable";

export default function BillEntryFormView({ state }) {

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          Compile Invoice Dispatch Node
        </h3>
      </div>

      <form onSubmit={state.commitBillSubmit}>
        {/* ============================================================
            BILL HEADER
        ============================================================ */}
        <div className="bg-[var(--bg-surface)] p-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Commercial Invoice Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Commercial Invoice Code{" "}
                <span className="text-[var(--brand-danger)]">*</span>
              </label>

              <input
                type="text"
                required
                className="flex h-10 w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]"
                value={state.billHeader.bill_num}
                onChange={(e) =>
                  state.setBillHeader({
                    ...state.billHeader,
                    bill_num: e.target.value,
                  })
                }
              />
            </div>

            {/* Invoice Billing Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Invoice Billing Date{" "}
                <span className="text-[var(--brand-danger)]">*</span>
              </label>

              <input
                type="date"
                required
                max={today}
                className="flex h-10 w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]"
                value={state.billHeader.bill_date}
                onChange={(e) =>
                  state.setBillHeader({
                    ...state.billHeader,
                    bill_date: e.target.value,
                  })
                }
              />
            </div>

            {/* Linked Order ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Linked Order ID Link
              </label>

              <input
                type="text"
                disabled
                className="flex h-10 w-full cursor-not-allowed rounded-md border border-[var(--border-light)] bg-[var(--bg-muted)] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)] opacity-70 outline-none"
                value={state.billHeader.order_acceptance_id}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            BILL ITEMS
        ============================================================ */}
        <div className="border-t border-[var(--border-light)] bg-[var(--bg-main)] p-5">
          <BillItemsTable state={state} />
        </div>

        {/* ============================================================
            ACTIONS
        ============================================================ */}
        <div className="flex justify-end gap-2 border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-5 py-4">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--combobox-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-1"
            onClick={() => state.setActiveTab("orders-list")}
          >
            Cancel

            <kbd className="ml-1.5 rounded border border-[var(--border-light)] bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              Esc
            </kbd>
          </button>

          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-[var(--brand-success)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-success)] focus:ring-offset-1"
          >
            Verify &amp; Log Commercial Invoice

            <kbd className="ml-1.5 rounded border border-white/20 bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </form>
    </div>
  );
}
