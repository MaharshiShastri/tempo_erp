import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import OrderItemRow from "./OrderItemRow";

export default function OrderItemsTable({ items }) {
    const rows = items || [];

    if (rows.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                <p className="text-sm font-medium">
                    No order items
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                    No line items are associated with this order.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="whitespace-nowrap">
                                Item Code
                            </TableHead>

                            <TableHead className="min-w-[260px]">
                                Specifications
                            </TableHead>

                            <TableHead className="whitespace-nowrap">
                                HSN
                            </TableHead>

                            <TableHead className="text-right whitespace-nowrap">
                                Qty
                            </TableHead>

                            <TableHead className="whitespace-nowrap">
                                Units
                            </TableHead>

                            <TableHead className="text-right whitespace-nowrap">
                                Rate
                            </TableHead>

                            <TableHead className="text-right whitespace-nowrap">
                                Discount
                            </TableHead>

                            <TableHead className="text-right whitespace-nowrap">
                                Net Amount
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.map((item, index) => (
                            <OrderItemRow
                                key={
                                    item.item_code
                                        ? `${item.item_code}-${index}`
                                        : index
                                }
                                item={item}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}