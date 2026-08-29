import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function QuotationDetailsModal({
    quotation,
    editMode,
    editForm,
    saving,
    onChange,
    onSave,
    onClose,
    onEdit,
}) {
    if (!quotation) {
        return null;
    }

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getValue = (key) =>
        editMode
            ? (editForm?.[key] ?? "")
            : (quotation?.[key] ?? "");

    const field = (
        label,
        key,
        {
            type = "text",
            multiline = false,
            rows = 3,
        } = {}
    ) => {
        const value = getValue(key);

        return (
            <div className="space-y-2">
                <label className="text-sm font-medium">
                    {label}
                </label>

                {editMode ? (
                    multiline ? (
                        <Textarea
                            rows={rows}
                            value={value}
                            onChange={(e) =>
                                onChange(
                                    key,
                                    e.target.value
                                )
                            }
                        />
                    ) : (
                        <Input
                            type={type}
                            value={value}
                            onChange={(e) =>
                                onChange(
                                    key,
                                    e.target.value
                                )
                            }
                        />
                    )
                ) : (
                    <div
                        className={`min-h-10 rounded-md border bg-muted/30 px-3 py-2 text-sm ${
                            multiline
                                ? "whitespace-pre-wrap"
                                : ""
                        }`}
                    >
                        {value || "—"}
                    </div>
                )}
            </div>
        );
    };

    const checkbox = (label, key) => {
        const checked = Boolean(
            editMode
                ? editForm?.[key]
                : quotation?.[key]
        );

        return (
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`quotation-${key}`}
                    checked={checked}
                    disabled={!editMode}
                    onCheckedChange={(value) =>
                        onChange(key, Boolean(value))
                    }
                />

                <label
                    htmlFor={`quotation-${key}`}
                    className="text-sm font-medium"
                >
                    {label}
                </label>
            </div>
        );
    };

    return (
        <Dialog
            open={Boolean(quotation)}
            onOpenChange={(open) => {
                if (!open && !saving) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editMode
                            ? "Edit Quotation"
                            : "Quotation Details"}
                    </DialogTitle>

                    <DialogDescription className="font-mono font-semibold text-primary">
                        {quotation.quote_number || "—"}
                    </DialogDescription>
                </DialogHeader>

                {/* Lifecycle */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-xs text-muted-foreground">
                            Status
                        </div>

                        <div className="mt-1 font-semibold">
                            {quotation.status || "GENERATED"}
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-xs text-muted-foreground">
                            Generated
                        </div>

                        <div className="mt-1 font-semibold">
                            {formatDate(
                                quotation.generated_at
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-xs text-muted-foreground">
                            Resolved
                        </div>

                        <div className="mt-1 font-semibold">
                            {formatDate(
                                quotation.resolved_at
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3">
                        <div className="text-xs text-muted-foreground">
                            ERP Order
                        </div>

                        <div
                            className={`mt-1 font-semibold ${
                                quotation.converted_order_id
                                    ? "text-emerald-600"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {quotation.converted_order_id
                                ? `#${quotation.converted_order_id}`
                                : "Not converted"}
                        </div>
                    </div>
                </div>

                {/* Customer */}
                <section className="space-y-4">
                    <h4 className="text-base font-semibold">
                        Customer Details
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {field(
                            "Customer Company",
                            "client_company"
                        )}

                        {field(
                            "Product",
                            "product_name"
                        )}

                        {field(
                            "Buyer Name",
                            "buyer_name"
                        )}

                        {field(
                            "Buyer Phone",
                            "buyer_phone_number"
                        )}

                        {field(
                            "Client Email",
                            "client_email",
                            { type: "email" }
                        )}

                        {field(
                            "Enquiry Date",
                            "enquiry_date",
                            { type: "date" }
                        )}

                        {field(
                            "City",
                            "client_city"
                        )}

                        {field(
                            "Postal Code",
                            "client_postal_code"
                        )}
                    </div>

                    {field(
                        "Address",
                        "client_address_line1",
                        {
                            multiline: true,
                            rows: 3,
                        }
                    )}
                </section>

                <div className="border-t" />

                {/* Commercial Terms */}
                <section className="space-y-4">
                    <h4 className="text-base font-semibold">
                        Commercial Terms
                    </h4>

                    {field("Supply", "supply", {
                        multiline: true,
                        rows: 4,
                    })}

                    {field(
                        "Installation",
                        "installation",
                        {
                            multiline: true,
                            rows: 3,
                        }
                    )}

                    {field("Freight", "freight", {
                        multiline: true,
                        rows: 3,
                    })}
                </section>

                {/* Flags */}
                <div className="flex flex-wrap gap-6 rounded-lg bg-muted/50 p-4">
                    {checkbox(
                        "Dealer quotation",
                        "is_dealer"
                    )}

                    {checkbox(
                        "Special model",
                        "is_special_model"
                    )}
                </div>

                {/* Sales Owner */}
                <section className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">
                        Sales Owner
                    </div>

                    <div className="mt-1 font-semibold">
                        {quotation.sales_user_name || "—"}
                    </div>

                    <div className="mt-0.5 text-xs text-muted-foreground">
                        {quotation.sales_user_email || "—"}
                    </div>
                </section>

                {/* Timeline */}
                <section className="rounded-lg border p-4">
                    <h5 className="mb-3 text-sm font-semibold">
                        Lifecycle Timeline
                    </h5>

                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                        <div>
                            <div className="text-xs text-muted-foreground">
                                Completed
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.completed_at
                                )}
                            </strong>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">
                                Rejected
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.rejected_at
                                )}
                            </strong>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">
                                Changed
                            </div>

                            <strong>
                                {formatDate(
                                    quotation.changed_at
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <DialogFooter>
                    {editMode ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={onSave}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Close
                            </Button>

                            <Button
                                type="button"
                                onClick={onEdit}
                            >
                                Edit Quotation
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}