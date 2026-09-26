import useTruckCanvas from "../hooks/dispatch/useTruckVisualizer";

import {
    Truck,
    Plus,
    Trash2,
    Box,
    Calendar,
    IndianRupee,
    Maximize2,
    RotateCw,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const getToday = () => {
    return new Date().toISOString().split("T")[0];
};

export default function DispatchPlannerView({ state }) {
    const topCanvasRef = useTruckCanvas(
        state.packedBoxes,
        state.truckDim,
        "top"
    );

    const sideCanvasRef = useTruckCanvas(
        state.packedBoxes,
        state.truckDim,
        "side"
    );

    const today = getToday();

    return (
        <div className="space-y-6 bg-[var(--bg-main)] text-[var(--text-primary)]">

            {/* =====================================================
                TRUCK CONFIGURATION
            ===================================================== */}

            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                        <Truck className="size-5 text-[var(--brand-accent)]" />
                        Truck Configuration
                    </CardTitle>
                </CardHeader>

                <CardContent className="bg-[var(--bg-surface)] pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="space-y-2">
                            <Label className="text-[var(--text-primary)]">
                                Package Dimension Unit
                            </Label>

                            <Select
                                value={state.unit}
                                onValueChange={state.setUnit}
                            >
                                <SelectTrigger className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:ring-[var(--brand-accent)]">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent className="border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
                                    <SelectItem
                                        value="in"
                                        className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                    >
                                        Inches
                                    </SelectItem>

                                    <SelectItem
                                        value="cm"
                                        className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                                    >
                                        Centimeters
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="truck-length"
                                className="text-[var(--text-primary)]"
                            >
                                Truck Length
                            </Label>

                            <Input
                                id="truck-length"
                                type="number"
                                min="0"
                                value={state.truckDim.length}
                                onChange={(e) =>
                                    state.updateTruckDimension(
                                        "length",
                                        e.target.value
                                    )
                                }
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="truck-width"
                                className="text-[var(--text-primary)]"
                            >
                                Truck Width
                            </Label>

                            <Input
                                id="truck-width"
                                type="number"
                                min="0"
                                value={state.truckDim.width}
                                onChange={(e) =>
                                    state.updateTruckDimension(
                                        "width",
                                        e.target.value
                                    )
                                }
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="truck-height"
                                className="text-[var(--text-primary)]"
                            >
                                Truck Height
                            </Label>

                            <Input
                                id="truck-height"
                                type="number"
                                min="0"
                                value={state.truckDim.height}
                                onChange={(e) =>
                                    state.updateTruckDimension(
                                        "height",
                                        e.target.value
                                    )
                                }
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                            />
                        </div>

                    </div>
                </CardContent>
            </Card>


            {/* =====================================================
                PACKAGE INPUT TABLE
            ===================================================== */}

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                <CardHeader className="border-b border-[var(--border-light)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                            <Box className="size-5 text-[var(--brand-accent)]" />

                            Dispatch Packages

                            <Badge
                                variant="secondary"
                                className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                            >
                                {state.plannerProducts.length}/20
                            </Badge>
                        </CardTitle>

                        <Button
                            type="button"
                            onClick={state.addProduct}
                            disabled={
                                state.plannerProducts.length >= 20
                            }
                            className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                        >
                            <Plus className="size-4" />
                            Add Package
                        </Button>

                    </div>
                </CardHeader>

                <CardContent className="space-y-4">

                    <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                        <Table className="min-w-[1000px]">

                            <TableHeader>
                                <TableRow className="border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                                    <TableHead className="w-[50px] text-[var(--text-primary)]">
                                        #
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Width
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Height
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Depth
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Invoice Value
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Due Date
                                    </TableHead>

                                    <TableHead className="text-[var(--text-primary)]">
                                        Colour
                                    </TableHead>

                                    <TableHead className="w-[80px] text-[var(--text-primary)]">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {state.plannerProducts.map(
                                    (product, index) => (
                                        <TableRow
                                            key={product.id}
                                            className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                                        >

                                            <TableCell className="font-medium text-[var(--text-primary)]">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={product.width}
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "width",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={product.height}
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "height",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={product.depth}
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "depth",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />

                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="border-[var(--border-light)] bg-[var(--bg-main)] pl-9 text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                                                        value={
                                                            product.invoiceValue
                                                        }
                                                        onChange={(e) =>
                                                            state.updateProduct(
                                                                index,
                                                                "invoiceValue",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />

                                                    <Input
                                                        type="date"
                                                        min={today}
                                                        className="border-[var(--border-light)] bg-[var(--bg-main)] pl-9 text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                                                        value={
                                                            product.dueDate
                                                        }
                                                        onChange={(e) =>
                                                            state.updateProduct(
                                                                index,
                                                                "dueDate",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="color"
                                                        value={
                                                            product.color ||
                                                            "#2490ef"
                                                        }
                                                        onChange={(e) =>
                                                            state.updateProduct(
                                                                index,
                                                                "color",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-9 w-12 cursor-pointer border-[var(--border-light)] bg-[var(--bg-main)] p-1"
                                                    />

                                                    <span className="font-mono text-xs text-[var(--text-muted)]">
                                                        {product.color}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        state.removeProduct(
                                                            index
                                                        )
                                                    }
                                                    disabled={
                                                        state
                                                            .plannerProducts
                                                            .length <= 1
                                                    }
                                                    title="Remove package"
                                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>

                                        </TableRow>
                                    )
                                )}
                            </TableBody>

                        </Table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                        <RotateCw className="size-4 text-[var(--brand-accent)]" />

                        <span>Dispatch priority:</span>

                        <Badge
                            variant="outline"
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-muted)]"
                        >
                            earliest due date
                        </Badge>

                        <span>→</span>

                        <Badge
                            variant="outline"
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-muted)]"
                        >
                            highest invoice value
                        </Badge>
                    </div>

                </CardContent>
            </Card>


            {/* =====================================================
                TRUCK SPATIAL VIEWS
            ===================================================== */}

            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                            <Maximize2 className="size-5 text-[var(--brand-accent)]" />
                            Truck Spatial Comparison
                        </CardTitle>

                        <span className="text-sm text-[var(--text-muted)]">
                            Top and side projections update simultaneously
                        </span>

                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">

                    <div className="grid gap-5 lg:grid-cols-2">

                        <TruckView
                            title="Top View"
                            description="Cargo layout • length × width"
                            canvasRef={topCanvasRef}
                        />

                        <TruckView
                            title="Side View"
                            description="Cargo height • length × height"
                            canvasRef={sideCanvasRef}
                        />

                    </div>

                </CardContent>
            </Card>


            {/* =====================================================
                REJECTED PACKAGES
            ===================================================== */}

            {state.packedBoxes.rejectedBoxes?.length > 0 && (
                <Alert
                    variant="destructive"
                    className="border-[var(--brand-danger)]/40 bg-[var(--warning-row)] text-[var(--text-primary)]"
                >
                    <AlertDescription className="font-medium text-[var(--brand-danger)]">
                        {state.packedBoxes.rejectedBoxes.length}{" "}
                        package(s) could not be loaded inside the
                        truck.
                    </AlertDescription>
                </Alert>
            )}

        </div>
    );
}


/* =========================================================
   TRUCK VIEW
========================================================= */

function TruckView({
    title,
    description,
    canvasRef,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] shadow-[var(--shadow-sm)]">

            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3">

                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--bg-muted)]">
                        <Truck className="size-4 text-[var(--brand-accent)]" />
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                            {title}
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
                            {description}
                        </div>
                    </div>
                </div>

                <Badge
                    variant="outline"
                    className="hidden border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--brand-success)] sm:inline-flex"
                >
                    Live
                </Badge>

            </div>

            <div className="relative h-[360px] w-full overflow-hidden bg-[var(--bg-muted)]">
                <canvas
                    ref={canvasRef}
                    className="block size-full"
                />
            </div>

        </div>
    );
}