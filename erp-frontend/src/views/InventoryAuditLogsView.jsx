import React, {useEffect, useState} from "react";
import {Card, CardHeader, CardTitle, CardContent,} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Table, TableHeader, TableBody, TableHead, TableRow, TableCell,} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { RefreshCw, BookOpen, PackageCheck, ShoppingCart } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
    if (auditType === "finished-goods"){
      state.refreshStockLedger();
    }

    if (auditType === "purchased-materials"){
      state.refreshPurchaseLedger();
    }
  }, [auditType]);

  const handleRefresh = async () => {
    if (auditType === "finished-goods"){
      await state.refreshStockLedger();
    }

    if(auditType === "purchased-materials"){
      await state.refreshPurchaseLedger();
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={auditType} onValueChange={setAuditType}>
            <TabsList>
              <TabsTrigger value="finished-goods" className="gap-2"><PackageCheck className="h-4 w-4"/>Finished Goods</TabsTrigger>
              <TabsTrigger value="purchased-materials" className="gap-2"><ShoppingCart className="h-4 w-4"/>Purchased Materials</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {auditType === "finished-goods" && (
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
        )}

        {auditType === "purchased-materials" && (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Purchase Date
                  </TableHead>

                  <TableHead>
                    Voucher
                  </TableHead>

                  <TableHead>
                    Supplier
                  </TableHead>

                  <TableHead>
                    Item
                  </TableHead>

                  <TableHead>
                    Specification
                  </TableHead>

                  <TableHead className="text-center">
                    Quantity
                  </TableHead>

                  <TableHead className="text-right">
                    Rate
                  </TableHead>

                  <TableHead className="text-right">
                    Amount
                  </TableHead>

                  <TableHead className="text-center">
                    GST
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                </TableRow>
              </TableHeader>

              <TableBody>
                {state.purchaseLedger?.length === 0 ? (
                  <TableRow>
                    <TableCell colspan={10} className="h-24 text-center text-muted-foreground">
                      No purchase records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.purchaseLedger?.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap">
                        {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : "-"}
                      </TableCell>

                      <TableCell className="font-mono font-medium">
                        {purchase.voucher_number}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{purchase.supplier}</span>
                          {purchase.place_of_supply && (
                            <span className="text-xs text-muted-foreground">
                              {purchase.place_of_supply}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono">
                        {purchase.item_code}
                      </TableCell>

                      <TableCell className="max-w-[280]">
                        <Textarea readOnly>{purchase.item_specification || "-"}</Textarea>
                      </TableCell>

                      <TableCell className="text-center font-semibold">
                        {purchase.billed_quantity}
                        {purchase.unit_measure && (
                          <span className="ml-1 text-xs text-muted-foreground">{purchase.unit_measure}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        ₹{Number(purchase.rate || 0).toLocaleString("en-IN", {minimumFractionDigits: 2,})}
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        ₹{Number(purchase.amount || 0).toLocaleString("en-IN", {minimumFractionDigits: 2,})}
                      </TableCell>

                      <TableCell className="text-center"><Badge variant="secondary">{purchase.gst_rate || 0}%</Badge></TableCell>

                      <TableCell>
                        {purchase.is_cancelled ? (
                          <Badge variant="destructive">Cancelled</Badge>
                        ):(
                          <Badge variant="default">Active</Badge>
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