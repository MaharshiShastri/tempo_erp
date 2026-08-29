import {
    TableCell,
    TableRow,
} from "@/components/ui/table";

export default function OrderItemRow({ item }) {
    const quantity = Number(
        item.quantity ?? 0
    );

    const rate = Number(
        item.rate ?? 0
    );

    const discount = Number(
        item.discount_percentage ?? 0
    );

    const total =
        quantity *
        rate *
        (1 - discount / 100);

    return (
        <TableRow className="hover:bg-muted/30">
            {/* ITEM CODE */}
            <TableCell className="align-top">
                <span className="font-mono text-xs font-semibold text-foreground">
                    {item.item_code || "N/A"}
                </span>
            </TableCell>

            {/* SPECIFICATION */}
            <TableCell className="max-w-[420px] align-top">
                <p className="whitespace-normal break-words text-sm">
                    {item.additional_spec_text ||
                        "No specification provided"}
                </p>
            </TableCell>

            {/* HSN */}
            <TableCell className="align-top">
                <span className="font-mono text-xs text-muted-foreground">
                    {item.hsn_code || "N/A"}
                </span>
            </TableCell>

            {/* QUANTITY */}
            <TableCell className="text-right align-top font-medium">
                {quantity}
            </TableCell>

            {/* UNIT */}
            <TableCell className="align-top">
                <span className="text-sm text-muted-foreground">
                    {item.um || "N/A"}
                </span>
            </TableCell>

            {/* RATE */}
            <TableCell className="text-right align-top font-mono">
                ₹{rate.toFixed(2)}
            </TableCell>

            {/* DISCOUNT */}
            <TableCell className="text-right align-top">
                <span className="text-sm">
                    {discount.toFixed(2)}%
                </span>
            </TableCell>

            {/* TOTAL */}
            <TableCell className="text-right align-top">
                <span className="font-mono text-sm font-bold">
                    ₹{total.toFixed(2)}
                </span>
            </TableCell>
        </TableRow>
    );
}