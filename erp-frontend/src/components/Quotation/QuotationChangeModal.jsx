import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function QuotationChangeModal({
    quotation,
    form,
    onChange,
    onCancel,
    onSubmit,
}) {
    const field = (
        name,
        label,
        type = "text"
    ) => (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                {label}
            </label>

            <Input
                type={type}
                value={form?.[name] ?? ""}
                onChange={(e) =>
                    onChange(
                        name,
                        e.target.value
                    )
                }
            />
        </div>
    );

    return (
        <Dialog
            open={Boolean(quotation)}
            onOpenChange={(open) => {
                if (!open) {
                    onCancel?.();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Quotation Changed
                    </DialogTitle>

                    <DialogDescription className="font-mono">
                        {quotation?.quote_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Quoted */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-semibold">
                            Quoted
                        </h4>

                        {field(
                            "quoted_product_name",
                            "Product"
                        )}

                        {field(
                            "quoted_item_code",
                            "Item Code"
                        )}

                        {field(
                            "quoted_quantity",
                            "Quantity",
                            "number"
                        )}

                        {field(
                            "quoted_rate",
                            "Rate",
                            "number"
                        )}
                    </div>

                    {/* Ordered */}
                    <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                        <h4 className="font-semibold">
                            Actually Ordered
                        </h4>

                        {field(
                            "ordered_product_name",
                            "Product *"
                        )}

                        {field(
                            "ordered_item_code",
                            "Item Code"
                        )}

                        {field(
                            "ordered_quantity",
                            "Quantity",
                            "number"
                        )}

                        {field(
                            "ordered_rate",
                            "Rate",
                            "number"
                        )}
                    </div>
                </div>

                {field(
                    "order_id",
                    "ERP Order ID",
                    "number"
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        onClick={onSubmit}
                    >
                        Save Snapshot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}