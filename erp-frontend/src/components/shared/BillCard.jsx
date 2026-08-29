import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

export default function BillCard({ bill }) {
    return (
        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                        >
                            {bill.bill_num}
                        </Badge>

                        <span className="text-sm text-muted-foreground">
                            Invoice Date:{" "}
                            <span className="font-medium text-foreground">
                                {bill.bill_date}
                            </span>
                        </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Source OA:{" "}
                        <span className="font-medium text-foreground">
                            {bill.order_acceptance_id || "—"}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    Billing Item Line ID
                                </TableHead>

                                <TableHead>
                                    Target Order Item Reference
                                </TableHead>

                                <TableHead>
                                    Resolved Item Code
                                </TableHead>

                                <TableHead className="text-right">
                                    Dispatched Quantity
                                </TableHead>

                                <TableHead className="text-right">
                                    Remaining to Bill
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {(bill.items ?? []).map((item, index) => {
                                const remainingQuantity =
                                    Number(item.remaining_quantity || 0);

                                const hasRemaining =
                                    remainingQuantity > 0;

                                return (
                                    <TableRow key={index}>
                                        <TableCell className="font-mono text-xs">
                                            # {item.bill_item_id || "Pending"}
                                        </TableCell>

                                        <TableCell className="text-muted-foreground">
                                            Row ID: {item.order_item_id}
                                        </TableCell>

                                        <TableCell>
                                            <span className="font-semibold">
                                                {item.item_code}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {item.quantity_shipped} Units
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    hasRemaining
                                                        ? "font-semibold text-destructive"
                                                        : "font-semibold text-emerald-600 dark:text-emerald-400"
                                                }
                                            >
                                                {item.remaining_quantity ?? "—"} Units
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}