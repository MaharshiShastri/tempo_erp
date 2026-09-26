import BillCard from "../components/shared/BillCard";

export default function BillsListView({ state }) {
  const bills = state.bills ?? [];

  return (
    <div className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          Commercial Dispatch Invoices Master Log
        </h2>

        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {bills.length} invoice{bills.length === 1 ? "" : "s"} in the
          current session.
        </p>
      </div>

      {/* ============================================================
          EMPTY STATE
      ============================================================ */}
      {bills.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] px-6 py-10 shadow-[var(--shadow-sm)]">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-muted)]">
              <span className="text-sm font-semibold text-[var(--brand-accent)]">
                —
              </span>
            </div>

            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No outgoing invoices found
            </p>

            <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
              No invoices match the current session parameters.
            </p>
          </div>
        </div>
      ) : (
        /* ============================================================
           BILL LIST
        ============================================================ */
        <div className="space-y-5">
          {bills.map((bill) => (
            <BillCard
              key={bill.bill_num}
              bill={bill}
            />
          ))}
        </div>
      )}
    </div>
  );
}
