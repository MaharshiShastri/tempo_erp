import React, { useMemo, useState } from "react";

import {
    Package,
    Plus,
    Search,
    Boxes,
    Pencil,
    IndianRupee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


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
                if (
                    selectedProductGroup &&
                    item.item_group !== selectedProductGroup
                ) {
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


    const themedInputClass =
        "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";


    return (
        <>
            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

                <CardHeader className="gap-4 border-b border-[var(--border-light)] bg-[var(--bg-muted)]">

                    <div className="space-y-3">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">

                                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--bg-main)] text-[var(--brand-accent)]">
                                    <Boxes className="size-4" />
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                                        {filteredItems.length}
                                    </span>

                                    <span className="ml-1 text-sm text-[var(--text-muted)]">
                                        products
                                    </span>
                                </div>

                            </div>


                            <div className="relative w-full sm:max-w-sm">

                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />

                                <Input
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search SKU, product or category..."
                                    className={`${themedInputClass} pl-9`}
                                />

                            </div>

                        </div>


                        {selectedProductGroup && (

                            <div className="flex items-center gap-2">

                                <span className="text-xs text-[var(--text-muted)]">
                                    Filtered by product group:
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedProductGroup(null)
                                    }
                                    className="
                                        inline-flex
                                        max-w-[280px]
                                        items-center
                                        gap-1.5
                                        rounded-full
                                        border
                                        border-[var(--border-light)]
                                        bg-[var(--bg-main)]
                                        px-2.5
                                        py-1
                                        text-xs
                                        font-medium
                                        text-[var(--brand-accent)]
                                        transition-colors
                                        hover:bg-[var(--combobox-hover)]
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

                            <TableHeader className="bg-[var(--bg-muted)]">

                                <TableRow className="border-[var(--border-light)] hover:bg-[var(--bg-muted)]">

                                    <TableHead className="w-[16%] font-semibold text-[var(--text-primary)]">
                                        Product Code
                                    </TableHead>

                                    <TableHead className="w-[27%] font-semibold text-[var(--text-primary)]">
                                        Product
                                    </TableHead>

                                    <TableHead className="w-[20%] font-semibold text-[var(--text-primary)]">
                                        Category
                                    </TableHead>

                                    <TableHead className="w-[14%] text-center font-semibold text-[var(--text-primary)]">
                                        Stock
                                    </TableHead>

                                    <TableHead className="w-[10%] font-semibold text-[var(--text-primary)]">
                                        UoM
                                    </TableHead>

                                    <TableHead className="w-[13%] text-right font-semibold text-[var(--text-primary)]">
                                        Base Price
                                    </TableHead>

                                </TableRow>

                            </TableHeader>


                            <TableBody>

                                {filteredItems.length > 0 ? (

                                    filteredItems.map((item) => (

                                        <TableRow
                                            key={item.item_code}
                                            className="border-[var(--border-light)] transition-colors hover:bg-[var(--combobox-hover)]"
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
                                                        border
                                                        border-[var(--border-light)]
                                                        bg-[var(--bg-muted)]
                                                        px-2
                                                        py-1
                                                        font-mono
                                                        text-xs
                                                        font-semibold
                                                        leading-relaxed
                                                        text-[var(--brand-accent)]
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
                                                        text-[var(--text-primary)]
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
                                                        const group =
                                                            item.item_group ||
                                                            "General";

                                                        setSelectedProductGroup(
                                                            (current) =>
                                                                current ===
                                                                group
                                                                    ? null
                                                                    : group
                                                        );
                                                    }}
                                                    title={`Filter by ${
                                                        item.item_group ||
                                                        "General"
                                                    }`}
                                                    className="max-w-full text-left"
                                                >

                                                    <Badge
                                                        variant="secondary"
                                                        className={`
                                                            max-w-full
                                                            cursor-pointer
                                                            border-[var(--border-light)]
                                                            bg-[var(--bg-muted)]
                                                            font-medium
                                                            text-[var(--brand-accent)]
                                                            transition-all
                                                            hover:border-[var(--border-subtle)]
                                                            hover:bg-[var(--combobox-hover)]
                                                            hover:text-[var(--text-primary)]
                                                            ${
                                                                selectedProductGroup ===
                                                                (item.item_group ||
                                                                    "General")
                                                                    ? "ring-2 ring-[var(--brand-accent)]/20"
                                                                    : ""
                                                            }
                                                        `}
                                                    >

                                                        <span className="block max-w-full truncate">
                                                            {item.item_group ||
                                                                "General"}
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
                                                                    item.available_stock ||
                                                                        0
                                                                ) >= 10
                                                                    ? "border-[var(--brand-success)]/40 bg-[var(--bg-muted)] text-[var(--brand-success)]"
                                                                    : Number(
                                                                        item.available_stock ||
                                                                            0
                                                                    ) > 0
                                                                    ? "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                                                                    : "border-[var(--brand-danger)]/40 bg-[var(--warning-row)] text-[var(--brand-danger)]"
                                                            }
                                                        `}
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
                                                            className="
                                                                size-8
                                                                shrink-0
                                                                text-[var(--brand-accent)]
                                                                hover:bg-[var(--combobox-hover)]
                                                                hover:text-[var(--brand-accent)]
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
                                                        border-[var(--border-light)]
                                                        bg-[var(--bg-main)]
                                                        font-medium
                                                        text-[var(--text-primary)]
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
                                                        text-[var(--brand-success)]
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

                                                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                                                    <Package className="size-7" />
                                                </div>

                                                <div>

                                                    <p className="font-semibold text-[var(--text-primary)]">
                                                        No products found
                                                    </p>

                                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
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

                <DialogContent className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

                    <DialogHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-5">

                        <div className="flex items-center gap-3">

                            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)]">

                                <Boxes className="size-5" />

                            </div>

                            <div>

                                <DialogTitle className="text-[var(--text-primary)]">
                                    Adjust Inventory
                                </DialogTitle>

                                <DialogDescription className="mt-1 text-[var(--text-muted)]">
                                    Update the stock quantity for this SKU.
                                </DialogDescription>

                            </div>

                        </div>

                    </DialogHeader>


                    <div className="space-y-5 px-6 py-5">

                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)] p-4">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {state.selectedItem?.item_name}
                                    </p>

                                    <p className="mt-1 text-sm text-[var(--text-muted)]">

                                        SKU:{" "}

                                        <span className="font-mono font-medium text-[var(--brand-accent)]">
                                            {state.selectedItem?.item_code}
                                        </span>

                                    </p>

                                </div>


                                <Badge className="border border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--brand-accent)] hover:bg-[var(--bg-main)]">

                                    {state.selectedItem?.available_stock ||
                                        0}{" "}
                                    in stock

                                </Badge>

                            </div>

                        </div>


                        <div className="space-y-2">

                            <label className="text-sm font-medium text-[var(--text-primary)]">
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

                                <SelectTrigger
                                    className={themedInputClass}
                                >
                                    <SelectValue />
                                </SelectTrigger>


                                <SelectContent className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]">

                                    <SelectItem
                                        value="add"
                                        className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                    >
                                        Add Stock
                                    </SelectItem>

                                    <SelectItem
                                        value="subtract"
                                        className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                    >
                                        Remove Stock
                                    </SelectItem>

                                    <SelectItem
                                        value="set"
                                        className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                    >
                                        Set Exact Quantity
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                        </div>


                        <div className="space-y-2">

                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                Quantity
                            </label>

                            <Input
                                type="number"
                                min={0}
                                className={themedInputClass}
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

                            <label className="text-sm font-medium text-[var(--text-primary)]">
                                Remarks
                            </label>

                            <Input
                                className={themedInputClass}
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


                    <DialogFooter className="border-t border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-4">

                        <Button
                            variant="outline"
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            onClick={state.closeStockModal}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={state.saveStockAdjustment}
                            className="bg-[var(--brand-success)] text-white hover:opacity-90"
                        >
                            Save Adjustment
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </>
    );
}