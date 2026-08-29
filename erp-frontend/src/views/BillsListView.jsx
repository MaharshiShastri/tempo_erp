import BillCard from "../components/shared/BillCard";

export default function BillsListView({ state }) {
    const bills = state.bills ?? [];

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight">
                    Commercial Dispatch Invoices Master Log
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    {bills.length} invoice{bills.length === 1 ? "" : "s"} in the current session.
                </p>
            </div>

            {bills.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10">
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                            No outgoing invoices found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            No invoices match the current session parameters.
                        </p>
                    </div>
                </div>
            ) : (
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