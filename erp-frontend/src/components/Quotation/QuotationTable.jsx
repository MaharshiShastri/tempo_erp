import QuotationStatusBadge from "./QuotationStatusBadge";
import QuotationActions from "./QuotationActions";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

export default function QuotationTable({
    quotations = [],
    onView,
    onEdit,
    onOrder,
    onReject,
    onChanged,
    onDownload,
}) {
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

    if (!quotations.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
                <div className="mb-2 text-3xl">📄</div>

                <strong className="text-sm">
                    No quotations found
                </strong>

                <div className="mt-1 text-xs text-muted-foreground">
                    Create your first quotation to begin tracking
                    the sales pipeline.
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Quote</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Enquiry</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {quotations.map((quotation) => {
                        const isDealer =
                            Boolean(quotation.is_dealer);

                        const isSpecial =
                            Boolean(
                                quotation.is_special_model
                            );

                        return (
                            <TableRow key={quotation.id}>
                                <TableCell>
                                    {quotation.document_path ? (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 font-mono"
                                            onClick={() =>
                                                onDownload?.(
                                                    quotation
                                                )
                                            }
                                        >
                                            {
                                                quotation.quote_number
                                            }
                                        </Button>
                                    ) : (
                                        <strong className="font-mono">
                                            {
                                                quotation.quote_number
                                            }
                                        </strong>
                                    )}

                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                        {formatDate(
                                            quotation.generated_at
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="font-semibold">
                                        {
                                            quotation.client_company
                                        }
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {quotation.buyer_name}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="font-semibold">
                                        {
                                            quotation.product_group
                                        }
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {formatDate(
                                        quotation.enquiry_date
                                    )}
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {isDealer && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                                DEALER
                                            </span>
                                        )}

                                        {isSpecial && (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                SPECIAL
                                            </span>
                                        )}

                                        {!isDealer &&
                                            !isSpecial && (
                                                <span className="text-xs text-muted-foreground">
                                                    Standard
                                                </span>
                                            )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <QuotationStatusBadge
                                        quotation={quotation}
                                    />

                                    {quotation.converted_order_id && (
                                        <div className="mt-1 text-[10px] text-muted-foreground">
                                            Order #
                                            {
                                                quotation.converted_order_id
                                            }
                                        </div>
                                    )}
                                </TableCell>

                                <TableCell className="whitespace-nowrap text-right">
                                    <QuotationActions
                                        quotation={quotation}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onOrder={onOrder}
                                        onReject={onReject}
                                        onChanged={onChanged}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}