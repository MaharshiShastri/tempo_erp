import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, BookOpen } from "lucide-react";

export default function InventoryAuditLogsView({ state }) {
  const getMovementVariant = (movementType) => {
    const type = movementType?.toLowerCase();

    if (type === "in" || type === "receipt" || type === "received") {
      return "default";
    }

    if (type === "out" || type === "issue" || type === "issued") {
      return "destructive";
    }

    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />

          <div>
            <CardTitle className="text-lg">
              Inventory Audit Trail
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Complete inventory movement and stock history.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={state.refreshStockLedger}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Movement</TableHead>

                <TableHead className="text-center">
                  Qty
                </TableHead>

                <TableHead className="text-center">
                  Before
                </TableHead>

                <TableHead className="text-center">
                  After
                </TableHead>

                <TableHead>Operator</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {state.stockLedger.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No inventory audit records found.
                  </TableCell>
                </TableRow>
              ) : (
                state.stockLedger.map((log) => {
                  const createdAt = new Date(log.created_at);
                  const quantityChange = Number(log.quantity_change || 0);

                  return (
                    <TableRow key={log.id}>
                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {createdAt.toLocaleString()}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {createdAt.toLocaleTimeString()}
                        </div>
                      </TableCell>

                      {/* Item */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-sm font-medium">
                            {log.item_code}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {log.item_name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Movement */}
                      <TableCell>
                        <Badge
                          variant={getMovementVariant(
                            log.movement_type
                          )}
                        >
                          {log.movement_type}
                        </Badge>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-center">
                        <span
                          className={
                            quantityChange >= 0
                              ? "font-semibold text-green-600 dark:text-green-400"
                              : "font-semibold text-red-600 dark:text-red-400"
                          }
                        >
                          {quantityChange > 0 ? "+" : ""}
                          {quantityChange}
                        </span>
                      </TableCell>

                      {/* Before */}
                      <TableCell className="text-center font-mono">
                        {log.stock_before}
                      </TableCell>

                      {/* After */}
                      <TableCell className="text-center font-mono font-semibold">
                        {log.stock_after}
                      </TableCell>

                      {/* Operator */}
                      <TableCell>
                        {log.operator}
                      </TableCell>

                      {/* Remarks */}
                      <TableCell className="max-w-[300px]">
                        <span className="text-sm text-muted-foreground">
                          {log.remarks || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}