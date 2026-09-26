import React, { useEffect, useState } from "react";

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

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  RefreshCw,
  BookOpen,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";

const themedTextareaClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

export default function InventoryAuditLogsView({ state }) {
  const [auditType, setAuditType] = useState("finished-goods");

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

  useEffect(() => {
    if (auditType === "finished-goods") {
      state.refreshStockLedger();
    }

    if (auditType === "purchased-materials") {
      state.refreshPurchaseLedger();
    }
  }, [auditType]);

  const handleRefresh = async () => {
    if (auditType === "finished-goods") {
      await state.refreshStockLedger();
    }

    if (auditType === "purchased-materials") {
      await state.refreshPurchaseLedger();
    }
  };

  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-[var(--border-light)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[var(--brand-accent)]" />

          <div>
            <CardTitle className="text-lg text-[var(--text-primary)]">
              Inventory Audit Trail
            </CardTitle>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Complete inventory movement and stock history.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={auditType} onValueChange={setAuditType}>
            <TabsList className="border border-[var(--border-light)] bg-[var(--bg-muted)]">
              <TabsTrigger
                value="finished-goods"
                className="gap-2 text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-main)] data-[state=active]:text-[var(--brand-accent)]"
              >
                <PackageCheck className="h-4 w-4" />
                Finished Goods
              </TabsTrigger>

              <TabsTrigger
                value="purchased-materials"
                className="gap-2 text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-main)] data-[state=active]:text-[var(--brand-accent)]"
              >
                <ShoppingCart className="h-4 w-4" />
                Purchased Materials
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {auditType === "finished-goods" && (
          <div className="overflow-x-auto rounded-md border border-[var(--border-light)]">
            <Table>
              <TableHeader className="bg-[var(--bg-muted)]">
                <TableRow className="border-b border-[var(--border-light)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-primary)]">
                    Date
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Item
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Movement
                  </TableHead>

                  <TableHead className="text-center text-[var(--text-primary)]">
                    Qty
                  </TableHead>

                  <TableHead className="text-center text-[var(--text-primary)]">
                    Before
                  </TableHead>

                  <TableHead className="text-center text-[var(--text-primary)]">
                    After
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Operator
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Remarks
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {state.stockLedger.length === 0 ? (
                  <TableRow className="border-b border-[var(--border-light)]">
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-[var(--text-muted)]"
                    >
                      No inventory audit records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.stockLedger.map((log) => {
                    const createdAt = new Date(log.created_at);
                    const quantityChange = Number(
                      log.quantity_change || 0
                    );

                    return (
                      <TableRow
                        key={log.id}
                        className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                      >
                        {/* Date */}
                        <TableCell className="whitespace-nowrap text-[var(--text-primary)]">
                          <div className="font-medium">
                            {createdAt.toLocaleString()}
                          </div>

                          <div className="text-xs text-[var(--text-muted)]">
                            {createdAt.toLocaleTimeString()}
                          </div>
                        </TableCell>

                        {/* Item */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                              {log.item_code}
                            </span>

                            <span className="text-xs text-[var(--text-muted)]">
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
                            className={
                              getMovementVariant(log.movement_type) ===
                              "default"
                                ? "bg-[var(--brand-success)] text-white"
                                : getMovementVariant(
                                      log.movement_type
                                    ) === "destructive"
                                  ? "bg-[var(--brand-danger)] text-white"
                                  : "border border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                            }
                          >
                            {log.movement_type}
                          </Badge>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-center">
                          <span
                            className={
                              quantityChange >= 0
                                ? "font-semibold text-[var(--brand-success)]"
                                : "font-semibold text-[var(--brand-danger)]"
                            }
                          >
                            {quantityChange > 0 ? "+" : ""}
                            {quantityChange}
                          </span>
                        </TableCell>

                        {/* Before */}
                        <TableCell className="text-center font-mono text-[var(--text-primary)]">
                          {log.stock_before}
                        </TableCell>

                        {/* After */}
                        <TableCell className="text-center font-mono font-semibold text-[var(--text-primary)]">
                          {log.stock_after}
                        </TableCell>

                        {/* Operator */}
                        <TableCell className="text-[var(--text-primary)]">
                          {log.operator}
                        </TableCell>

                        {/* Remarks */}
                        <TableCell className="max-w-[300px]">
                          <span className="text-sm text-[var(--text-muted)]">
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
        )}

        {auditType === "purchased-materials" && (
          <div className="overflow-x-auto rounded-md border border-[var(--border-light)]">
            <Table>
              <TableHeader className="bg-[var(--bg-muted)]">
                <TableRow className="border-b border-[var(--border-light)] hover:bg-transparent">
                  <TableHead className="text-[var(--text-primary)]">
                    Purchase Date
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Voucher
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Supplier
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Item
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Specification
                  </TableHead>

                  <TableHead className="text-center text-[var(--text-primary)]">
                    Quantity
                  </TableHead>

                  <TableHead className="text-right text-[var(--text-primary)]">
                    Rate
                  </TableHead>

                  <TableHead className="text-right text-[var(--text-primary)]">
                    Amount
                  </TableHead>

                  <TableHead className="text-center text-[var(--text-primary)]">
                    GST
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {state.purchaseLedger?.length === 0 ? (
                  <TableRow className="border-b border-[var(--border-light)]">
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-[var(--text-muted)]"
                    >
                      No purchase records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.purchaseLedger?.map((purchase) => (
                    <TableRow
                      key={purchase.id}
                      className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                    >
                      <TableCell className="whitespace-nowrap text-[var(--text-primary)]">
                        {purchase.purchase_date
                          ? new Date(
                              purchase.purchase_date
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>

                      <TableCell className="font-mono font-medium text-[var(--text-primary)]">
                        {purchase.voucher_number}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--text-primary)]">
                            {purchase.supplier}
                          </span>

                          {purchase.place_of_supply && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {purchase.place_of_supply}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-[var(--text-primary)]">
                        {purchase.item_code}
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <Textarea
                          readOnly
                          className={themedTextareaClass}
                          value={purchase.item_specification || "-"}
                        />
                      </TableCell>

                      <TableCell className="text-center font-semibold text-[var(--text-primary)]">
                        {purchase.billed_quantity}

                        {purchase.unit_measure && (
                          <span className="ml-1 text-xs text-[var(--text-muted)]">
                            {purchase.unit_measure}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right text-[var(--text-primary)]">
                        ₹
                        {Number(
                          purchase.rate || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-[var(--text-primary)]">
                        ₹
                        {Number(
                          purchase.amount || 0
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]">
                          {purchase.gst_rate || 0}%
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {purchase.is_cancelled ? (
                          <Badge className="bg-[var(--brand-danger)] text-white">
                            Cancelled
                          </Badge>
                        ) : (
                          <Badge className="bg-[var(--brand-success)] text-white">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}