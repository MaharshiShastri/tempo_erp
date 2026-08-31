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
    const [selectedProductGroup, setSelectedProductGroup] = useState(null);

    const canManageInventory = [
        "Admin",
        "Shop Floor Administrator",
        "Chief Full Stack Developer",
    ].includes(state.user?.role);

    const filteredItems = useMemo(() => {
        const items = state.itemsMaster || [];
        const search = searchQuery.toLowerCase().trim();

        return [...items]
            .filter((item) => {
                if(selectedProductGroup&& item.item_group !== selectedProductGroup){
                    return false;
                }

                return (
                    item.item_code?.toLowerCase().includes(search) ||
                    item.item_name?.toLowerCase().includes(search) ||
                    item.item_group?.toLowerCase().includes(search)
                );
            })
            .sort((a, b) =>
                a.item_code.localeCompare(b.item_code)
            );
    }, [state.itemsMaster, searchQuery, selectedProductGroup]);


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
            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="gap-4 border-b bg-gradient-to-r from-blue-500/10 via-background to-violet-500/10">

                    <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Boxes className="size-4" />
                                </div>

                                <div>
                                    <span className="text-sm font-semibold">
                                        {filteredItems.length}
                                    </span>

                                    <span className="ml-1 text-sm text-muted-foreground">
                                        products
                                    </span>
                                </div>
                            </div>

                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search SKU, product or category..."
                                    className="
                                        border-blue-200
                                        bg-background
                                        pl-9
                                        shadow-sm
                                        focus-visible:ring-blue-500/30
                                        dark:border-blue-900
                                    "
                                />
                            </div>
                        </div>

                        {selectedProductGroup && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    Filtered by product group:
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setSelectedProductGroup(null)}
                                    className="
                                        inline-flex
                                        max-w-[280px]
                                        items-center
                                        gap-1.5
                                        rounded-full
                                        border
                                        border-violet-200
                                        bg-violet-500/10
                                        px-2.5
                                        py-1
                                        text-xs
                                        font-medium
                                        text-violet-700
                                        transition-colors
                                        hover:bg-violet-500/20
                                        dark:border-violet-900
                                        dark:text-violet-300
                                    "
                                    title="Clear product group filter"
                                >
                                    <span className="truncate">
                                        {selectedProductGroup}
                                    </span>

                                    <span className="shrink-0 text-sm leading-none">
                                        ×
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="w-full overflow-hidden">
                        <Table className="w-full table-fixed">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50">
                                    <TableHead className="w-[16%] font-semibold">
                                        Product Code
                                    </TableHead>

                                    <TableHead className="w-[27%] font-semibold">
                                        Product
                                    </TableHead>

                                    <TableHead className="w-[20%] font-semibold">
                                        Category
                                    </TableHead>

                                    <TableHead className="w-[14%] text-center font-semibold">
                                        Stock
                                    </TableHead>

                                    <TableHead className="w-[10%] font-semibold">
                                        UoM
                                    </TableHead>

                                    <TableHead className="w-[13%] text-right font-semibold">
                                        Base Price
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <TableRow
                                            key={item.item_code}
                                            className="
                                                transition-colors
                                                hover:bg-blue-50/50
                                                dark:hover:bg-blue-950/20
                                            "
                                        >
                                            {/* PRODUCT CODE */}
                                            <TableCell className="align-top">
                                                <div
                                                    className="
                                                        inline-block
                                                        max-w-full
                                                        break-words
                                                        whitespace-normal
                                                        rounded-md
                                                        bg-blue-500/10
                                                        px-2
                                                        py-1
                                                        font-mono
                                                        text-xs
                                                        font-semibold
                                                        leading-relaxed
                                                        text-blue-700
                                                        dark:text-blue-400
                                                    "
                                                    title={item.item_code}
                                                >
                                                    {item.item_code}
                                                </div>
                                            </TableCell>

                                            {/* PRODUCT NAME */}
                                            <TableCell className="align-top">
                                                <div
                                                    className="
                                                        max-w-full
                                                        break-words
                                                        whitespace-normal
                                                        font-medium
                                                        leading-relaxed
                                                        text-foreground
                                                    "
                                                    title={item.item_name}
                                                >
                                                    {item.item_name}
                                                </div>
                                            </TableCell>

                                            {/* CATEGORY */}
                                            <TableCell className="align-top">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const group = item.item_group || "General";

                                                        setSelectedProductGroup((current) =>
                                                            current === group ? null : group
                                                        );
                                                    }}
                                                    title={`Filter by ${item.item_group || "General"}`}
                                                    className="max-w-full text-left"
                                                >
                                                    <Badge
                                                        variant="secondary"
                                                        className={`
                                                            max-w-full
                                                            cursor-pointer
                                                            border-violet-200
                                                            bg-violet-500/10
                                                            font-medium
                                                            text-violet-700
                                                            transition-all
                                                            hover:border-violet-300
                                                            hover:bg-violet-500/20
                                                            hover:text-violet-800
                                                            dark:border-violet-900
                                                            dark:text-violet-300
                                                            dark:hover:bg-violet-500/20
                                                            ${
                                                                selectedProductGroup ===
                                                                (item.item_group || "General")
                                                                    ? "border-violet-400 bg-violet-500/20 ring-2 ring-violet-500/20"
                                                                    : ""
                                                            }
                                                        `}
                                                    >
                                                        <span className="block max-w-full truncate">
                                                            {item.item_group || "General"}
                                                        </span>
                                                    </Badge>
                                                </button>
                                            </TableCell>

                                            {/* STOCK */}
                                            <TableCell className="align-top text-center">
                                                <div className="flex items-start justify-center gap-2">
                                                    <Badge
                                                        variant={getStockVariant(
                                                            item.available_stock
                                                        )}
                                                        className={`
                                                            min-w-[48px]
                                                            shrink-0
                                                            justify-center
                                                            font-semibold
                                                            ${
                                                                Number(
                                                                    item.available_stock || 0
                                                                ) >= 10
                                                                    ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400"
                                                                    : Number(
                                                                        item.available_stock || 0
                                                                    ) > 0
                                                                    ? "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900 dark:text-amber-400"
                                                                    : ""
                                                            }
                                                        `}
                                                    >
                                                        {item.available_stock || 0}
                                                    </Badge>

                                                    {canManageInventory && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                state.openStockModal(item)
                                                            }
                                                            title="Adjust stock"
                                                            className="
                                                                size-8
                                                                shrink-0
                                                                text-blue-600
                                                                hover:bg-blue-500/10
                                                                hover:text-blue-700
                                                            "
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* UOM */}
                                            <TableCell className="align-top">
                                                <Badge
                                                    variant="outline"
                                                    className="
                                                        max-w-full
                                                        whitespace-normal
                                                        break-words
                                                        leading-relaxed
                                                        border-slate-300
                                                        bg-slate-50
                                                        font-medium
                                                        text-slate-700
                                                        dark:border-slate-700
                                                        dark:bg-slate-900
                                                        dark:text-slate-300
                                                    "
                                                >
                                                    {item.unit_measure}
                                                </Badge>
                                            </TableCell>

                                            {/* BASE PRICE */}
                                            <TableCell className="align-top text-right">
                                                <div
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        justify-end
                                                        gap-1
                                                        whitespace-nowrap
                                                        font-semibold
                                                        text-emerald-600
                                                        dark:text-emerald-400
                                                    "
                                                >
                                                    <IndianRupee className="size-3.5 shrink-0" />

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
                                            className="h-48 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    <Package className="size-7" />
                                                </div>

                                                <div>
                                                    <p className="font-semibold">
                                                        No products found
                                                    </p>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Try adjusting your search criteria.
                                                    </p>
                                                </div>
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

                <DialogContent className="overflow-hidden border-border/70 p-0 shadow-xl">

                    <DialogHeader className="border-b bg-gradient-to-r from-blue-500/10 via-background to-violet-500/10 px-6 py-5">
                        <div className="flex items-center gap-3">

                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <Boxes className="size-5" />
                            </div>

                            <div>
                                <DialogTitle>
                                    Adjust Inventory
                                </DialogTitle>

                                <DialogDescription className="mt-1">
                                    Update the stock quantity for this SKU.
                                </DialogDescription>
                            </div>

                        </div>
                    </DialogHeader>


                    <div className="space-y-5 px-6 py-5">

                        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">

                            <div className="flex items-start justify-between gap-4">

                                <div>
                                    <p className="font-semibold">
                                        {state.selectedItem?.item_name}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        SKU:{" "}
                                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                                            {state.selectedItem?.item_code}
                                        </span>
                                    </p>
                                </div>

                                <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                                    {state.selectedItem?.available_stock || 0} in stock
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


                    <DialogFooter className="border-t bg-muted/20 px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={state.closeStockModal}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={state.saveStockAdjustment}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Save Adjustment
                        </Button>
                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </>
    );
}