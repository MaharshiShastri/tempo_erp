import React from "react";

export default function ItemMasterDetailView({ state }) {
    const item = state.itemDetail;

    if (!item) {
        return (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                Item not found.
            </div>
        );
    }

    const themedInputClass =
        "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] disabled:cursor-default disabled:opacity-100";

    return (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

            <div className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    📦 {item.item_code}
                </h3>
            </div>

            <div className="space-y-6 p-6">

                <div className="grid gap-5 md:grid-cols-2">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                            Product Name
                        </label>

                        <input
                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${themedInputClass}`}
                            value={item.item_name}
                            disabled
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                            HSN Code
                        </label>

                        <input
                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${themedInputClass}`}
                            value={item.hsn_code || ""}
                            disabled
                        />
                    </div>

                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                        Technical Specification
                    </label>

                    <textarea
                        rows="5"
                        className={`w-full resize-y rounded-md border px-3 py-2 text-sm outline-none ${themedInputClass}`}
                        value={item.additional_spec_text || ""}
                        disabled
                    />
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[var(--border-light)] pt-6">

                    <button
                        type="button"
                        className="rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--combobox-hover)]"
                        onClick={() =>
                            state.setActiveTab("items-master")
                        }
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        className="rounded-md bg-[var(--brand-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        className="rounded-md bg-[var(--brand-danger)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        Disable
                    </button>

                </div>

            </div>

        </div>
    );
}