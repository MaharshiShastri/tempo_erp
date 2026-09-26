import React from "react";

import {
    PackagePlus,
    Tag,
    IndianRupee,
    Ruler,
    FileCode2,
    Hash,
    ClipboardList,
    Save,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function ItemMasterCreateView({ state }) {

    const productGroups = [
        "Cements",
        "Dairy&Veterinary",
        "Flexotherm",
        "Flexotherm in Cements",
        "Ovens",
        "Rubber",
        "Others",
    ];

    const themedInputClass =
        "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

    return (
        <Card className="mx-auto max-w-6xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">

                <div className="flex items-center gap-3">

                    <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--bg-main)] text-[var(--brand-accent)]">

                        <PackagePlus className="size-5" />

                    </div>

                    <div>

                        <CardTitle className="text-[var(--text-primary)]">
                            Create Product SKU
                        </CardTitle>

                        <CardDescription className="text-[var(--text-muted)]">
                            Add a new product to the enterprise inventory master.
                        </CardDescription>

                    </div>

                </div>

            </CardHeader>


            <CardContent className="p-6">

                <form
                    onSubmit={
                        state.commitItemSubmit
                    }
                    className="space-y-8"
                >

                    {/* BASIC PRODUCT INFORMATION */}

                    <div className="space-y-5">

                        <div className="flex items-center gap-2">

                            <Tag className="size-4 text-[var(--brand-accent)]" />

                            <h3 className="font-semibold text-[var(--text-primary)]">

                                Product Information

                            </h3>

                        </div>


                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">

                            <div className="space-y-2">

                                <label className="text-sm font-medium text-[var(--text-primary)]">

                                    Product Code (SKU)

                                </label>

                                <Input
                                    required
                                    className={themedInputClass}
                                    value={
                                        state.itemForm.item_code
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            item_code:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="TEMPO-100"
                                />

                            </div>


                            <div className="space-y-2 lg:col-span-2">

                                <label className="text-sm font-medium text-[var(--text-primary)]">

                                    Product Name

                                </label>

                                <Input
                                    required
                                    className={themedInputClass}
                                    value={
                                        state.itemForm.item_name
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            item_name:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Precision Thermocouple..."
                                />

                            </div>


                            <div className="space-y-2">

                                <label className="text-sm font-medium text-[var(--text-primary)]">

                                    Product Group

                                </label>

                                <Select
                                    value={
                                        state.itemForm.item_group
                                    }
                                    onValueChange={(value) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            item_group: value,
                                        })
                                    }
                                >

                                    <SelectTrigger
                                        className={themedInputClass}
                                    >

                                        <SelectValue placeholder="Select category" />

                                    </SelectTrigger>


                                    <SelectContent className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]">

                                        {productGroups.map(
                                            (group) => (

                                                <SelectItem
                                                    key={group}
                                                    value={group}
                                                    className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                                >

                                                    {group}

                                                </SelectItem>

                                            )
                                        )}

                                    </SelectContent>

                                </Select>

                            </div>


                            <div className="space-y-2">

                                <label className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">

                                    <IndianRupee className="size-3.5 text-[var(--brand-success)]" />

                                    Base Price

                                </label>

                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className={themedInputClass}
                                    value={
                                        state.itemForm.rate
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            rate:
                                                parseFloat(
                                                    e.target.value
                                                ) || 0,
                                        })
                                    }
                                />

                            </div>

                        </div>


                        <div className="grid gap-5 md:grid-cols-3">

                            <div className="space-y-2">

                                <label className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">

                                    <Ruler className="size-3.5 text-[var(--brand-accent)]" />

                                    Unit of Measure

                                </label>

                                <Input
                                    required
                                    className={themedInputClass}
                                    value={
                                        state.itemForm
                                            .unit_measure
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            unit_measure:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="NOS, KG, MTR"
                                />

                            </div>


                            <div className="space-y-2">

                                <label className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">

                                    <FileCode2 className="size-3.5 text-[var(--brand-accent)]" />

                                    HSN Code

                                </label>

                                <Input
                                    className={themedInputClass}
                                    value={
                                        state.itemForm.hsn_code
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            hsn_code:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>


                            <div className="space-y-2">

                                <label className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">

                                    <Hash className="size-3.5 text-[var(--brand-accent)]" />

                                    Revision No.

                                </label>

                                <Input
                                    className={themedInputClass}
                                    value={
                                        state.itemForm.revision_no
                                    }
                                    onChange={(e) =>
                                        state.setItemForm({
                                            ...state.itemForm,
                                            revision_no:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    {/* TECHNICAL SPECIFICATIONS */}

                    <div className="space-y-3 border-t border-[var(--border-light)] pt-6">

                        <div className="flex items-center gap-2">

                            <ClipboardList className="size-4 text-[var(--brand-accent)]" />

                            <h3 className="font-semibold text-[var(--text-primary)]">

                                Technical Specification

                            </h3>

                        </div>


                        <Textarea
                            rows={7}
                            className={themedInputClass}
                            value={
                                state.itemForm
                                    .additional_spec_text
                            }
                            onChange={(e) =>
                                state.setItemForm({
                                    ...state.itemForm,
                                    additional_spec_text:
                                        e.target.value,
                                })
                            }
                            placeholder="Enter technical specifications, materials, tolerances, dimensions, operating parameters..."
                        />

                    </div>


                    {/* ACTIONS */}

                    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-light)] pt-6 sm:flex-row sm:justify-between">

                        <Button
                            type="button"
                            variant="outline"
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            onClick={() =>
                                state.setActiveTab(
                                    "items-master"
                                )
                            }
                        >

                            <X className="mr-2 size-4" />

                            Cancel

                        </Button>


                        <Button
                            type="submit"
                            className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                        >

                            <Save className="mr-2 size-4" />

                            Save SKU

                        </Button>

                    </div>

                </form>

            </CardContent>

        </Card>
    );
}