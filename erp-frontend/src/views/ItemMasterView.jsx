import React, { useMemo, useState } from "react";

import {Package, Plus, Search, Boxes, Pencil, IndianRupee,} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";

import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";


export default function ItemMasterView({ state }) {
    const [searchQuery, setSearchQuery] = useState("");

    const canManageInventory = [
        "Admin",
        "Shop Floor Administrator",
        "Chief Full Stack Developer",
    ].includes(state.user?.role);

    const filteredItems = useMemo(() => {
        const items = state.itemsMaster || [];

        return [...items]
            .filter((item) => {
                const search = searchQuery.toLowerCase();

                return (
                    item.item_code
                        ?.toLowerCase()
                        .includes(search) ||
                    item.item_name
                        ?.toLowerCase()
                        .includes(search) ||
                    item.item_group
                        ?.toLowerCase()
                        .includes(search)
                );
            })
            .sort((a, b) =>
                a.item_code.localeCompare(b.item_code)
            );
    }, [state.itemsMaster, searchQuery]);


    const getStockVariant = (stock) => {
        const value = Number(stock || 0);

        if (value <= 0) {
            return "destructive";
        }

        if (value < 10) {
            return "secondary";
        }

        return "default";
    };


    return (
        <>
            <Card>
                <CardHeader className="gap-4 border-b bg-muted/20">

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div className="space-y-1">

                            <div className="flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Package className="size-5" />
                                </div>

                                <div>
                                    <CardTitle>
                                        Enterprise Inventory
                                    </CardTitle>

                                    <CardDescription>
                                        Product master and live stock ledger
                                    </CardDescription>
                                </div>
                            </div>

                        </div>


                        {canManageInventory && (
                            <Button
                                onClick={() =>
                                    state.setActiveTab(
                                        "item-create"
                                    )
                                }
                            >
                                <Plus className="mr-2 size-4" />

                                New SKU
                            </Button>
                        )}

                    </div>


                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">

                            <Boxes className="size-4 text-primary" />

                            <span>
                                {filteredItems.length} products
                            </span>

                        </div>


                        <div className="relative w-full sm:max-w-sm">

                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(
                                        e.target.value
                                    )
                                }
                                placeholder="Search SKU, product or category..."
                                className="pl-9"
                            />

                        </div>

                    </div>

                </CardHeader>


                <CardContent className="p-0">

                    <div className="overflow-x-auto">

                        <Table>

                            <TableHeader>

                                <TableRow>

                                    <TableHead>
                                        Product Code
                                    </TableHead>

                                    <TableHead>
                                        Product
                                    </TableHead>

                                    <TableHead>
                                        Category
                                    </TableHead>

                                    <TableHead className="text-center">
                                        Stock
                                    </TableHead>

                                    <TableHead>
                                        UoM
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Base Price
                                    </TableHead>

                                </TableRow>

                            </TableHeader>


                            <TableBody>

                                {filteredItems.length > 0 ? (

                                    filteredItems.map((item) => (

                                        <TableRow
                                            key={item.item_code}
                                        >

                                            <TableCell>

                                                <div className="font-mono text-sm font-semibold text-primary">
                                                    {item.item_code}
                                                </div>

                                            </TableCell>


                                            <TableCell>

                                                <div className="font-medium">
                                                    {item.item_name}
                                                </div>

                                            </TableCell>


                                            <TableCell>

                                                <Badge
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    {item.item_group ||
                                                        "General"}
                                                </Badge>

                                            </TableCell>


                                            <TableCell className="text-center">

                                                <div className="flex items-center justify-center gap-2">

                                                    <Badge
                                                        variant={getStockVariant(
                                                            item.available_stock
                                                        )}
                                                    >
                                                        {item.available_stock ||
                                                            0}
                                                    </Badge>


                                                    {canManageInventory && (

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                state.openStockModal(
                                                                    item
                                                                )
                                                            }
                                                            title="Adjust stock"
                                                        >

                                                            <Pencil className="size-3.5 text-primary" />

                                                        </Button>

                                                    )}

                                                </div>

                                            </TableCell>


                                            <TableCell>

                                                <Badge
                                                    variant="outline"
                                                    className="font-normal"
                                                >
                                                    {item.unit_measure}
                                                </Badge>

                                            </TableCell>


                                            <TableCell className="text-right font-semibold">

                                                <div className="flex items-center justify-end gap-1">

                                                    <IndianRupee className="size-3.5 text-emerald-600" />

                                                    {Number(
                                                        item.rate || 0
                                                    ).toFixed(2)}

                                                </div>

                                            </TableCell>

                                        </TableRow>

                                    ))

                                ) : (

                                    <TableRow>

                                        <TableCell
                                            colSpan={6}
                                            className="h-40 text-center"
                                        >

                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">

                                                <Package className="size-8 opacity-50" />

                                                <span>
                                                    No products found.
                                                </span>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                )}

                            </TableBody>

                        </Table>

                    </div>

                </CardContent>

            </Card>


            <Dialog
                open={state.stockModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        state.closeStockModal();
                    }
                }}
            >

                <DialogContent>

                    <DialogHeader>

                        <DialogTitle>
                            Adjust Inventory
                        </DialogTitle>

                        <DialogDescription>
                            Update the stock quantity for this SKU.
                        </DialogDescription>

                    </DialogHeader>


                    <div className="space-y-4">

                        <div className="rounded-lg border bg-muted/40 p-3">

                            <p className="font-medium">

                                {state.selectedItem?.item_name}

                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">

                                SKU:{" "}

                                <span className="font-mono">

                                    {
                                        state.selectedItem
                                            ?.item_code
                                    }

                                </span>

                            </p>


                            <div className="mt-3 flex items-center gap-2">

                                <span className="text-sm text-muted-foreground">
                                    Current Stock
                                </span>

                                <Badge>

                                    {
                                        state.selectedItem
                                            ?.available_stock
                                    }

                                </Badge>

                            </div>

                        </div>


                        <div className="space-y-2">

                            <label className="text-sm font-medium">

                                Operation

                            </label>

                            <Select
                                value={
                                    state.stockModal.operation
                                }
                                onValueChange={(value) =>
                                    state.setStockModal({
                                        ...state.stockModal,
                                        operation: value,
                                    })
                                }
                            >

                                <SelectTrigger>

                                    <SelectValue />

                                </SelectTrigger>


                                <SelectContent>

                                    <SelectItem value="add">

                                        Add Stock

                                    </SelectItem>

                                    <SelectItem value="subtract">

                                        Remove Stock

                                    </SelectItem>

                                    <SelectItem value="set">

                                        Set Exact Quantity

                                    </SelectItem>

                                </SelectContent>

                            </Select>

                        </div>


                        <div className="space-y-2">

                            <label className="text-sm font-medium">

                                Quantity

                            </label>

                            <Input
                                type="number"
                                min={0}
                                value={
                                    state.stockModal.quantity
                                }
                                onChange={(e) =>
                                    state.setStockModal({
                                        ...state.stockModal,
                                        quantity: Number(
                                            e.target.value
                                        ),
                                    })
                                }
                            />

                        </div>


                        <div className="space-y-2">

                            <label className="text-sm font-medium">

                                Remarks

                            </label>

                            <Input
                                value={
                                    state.stockModal.remarks
                                }
                                onChange={(e) =>
                                    state.setStockModal({
                                        ...state.stockModal,
                                        remarks: e.target.value,
                                    })
                                }
                                placeholder="Reason for stock adjustment..."
                            />

                        </div>

                    </div>


                    <DialogFooter>

                        <Button
                            variant="outline"
                            onClick={state.closeStockModal}
                        >
                            Cancel
                        </Button>


                        <Button
                            onClick={
                                state.saveStockAdjustment
                            }
                        >
                            Save Adjustment
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </>
    );
}