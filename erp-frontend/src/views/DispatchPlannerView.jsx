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

    const leftCanvasRef = useTruckCanvas(
        state.packedBoxes,
        state.truckDim,
        "left"
    );

    const rightCanvasRef = useTruckCanvas(
        state.packedBoxes,
        state.truckDim,
        "right"
    );

    const today = getToday();

    return (
        <div className="space-y-6">
            {/* ===================================================== */}
            {/* TRUCK CONFIGURATION */}
            {/* ===================================================== */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="size-5 text-primary" />
                        Dynamic Truck Spatial Visualizer
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* UNIT */}

                        <div className="space-y-2">
                            <Label>
                                Package Dimension Unit
                            </Label>

                            <Select
                                value={state.unit}
                                onValueChange={state.setUnit}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="in">
                                        Inches
                                    </SelectItem>

                                    <SelectItem value="cm">
                                        Centimeters
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* LENGTH */}

                        <div className="space-y-2">
                            <Label htmlFor="truck-length">
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
                            />
                        </div>

                        {/* WIDTH */}

                        <div className="space-y-2">
                            <Label htmlFor="truck-width">
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
                            />
                        </div>

                        {/* HEIGHT */}

                        <div className="space-y-2">
                            <Label htmlFor="truck-height">
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
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===================================================== */}
            {/* PACKAGE INPUT TABLE */}
            {/* ===================================================== */}

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Box className="size-5 text-primary" />
                            Dispatch Packages

                            <Badge variant="secondary">
                                {state.plannerProducts.length}/20
                            </Badge>
                        </CardTitle>

                        <Button
                            type="button"
                            onClick={state.addProduct}
                            disabled={
                                state.plannerProducts.length >= 20
                            }
                        >
                            <Plus className="size-4" />
                            Add Package
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="overflow-x-auto rounded-md border">
                        <Table className="min-w-[1000px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        #
                                    </TableHead>

                                    <TableHead>
                                        Width
                                    </TableHead>

                                    <TableHead>
                                        Height
                                    </TableHead>

                                    <TableHead>
                                        Depth
                                    </TableHead>

                                    <TableHead>
                                        Invoice Value
                                    </TableHead>

                                    <TableHead>
                                        Due Date
                                    </TableHead>

                                    <TableHead>
                                        Colour
                                    </TableHead>

                                    <TableHead className="w-[80px]">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {state.plannerProducts.map(
                                    (product, index) => (
                                        <TableRow key={product.id}>
                                            {/* NUMBER */}

                                            <TableCell className="font-medium">
                                                {index + 1}
                                            </TableCell>

                                            {/* WIDTH */}

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        product.width
                                                    }
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "width",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            {/* HEIGHT */}

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        product.height
                                                    }
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "height",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            {/* DEPTH */}

                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={
                                                        product.depth
                                                    }
                                                    onChange={(e) =>
                                                        state.updateProduct(
                                                            index,
                                                            "depth",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </TableCell>

                                            {/* INVOICE */}

                                            <TableCell>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="pl-9"
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

                                            {/* DUE DATE */}

                                            <TableCell>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                                    <Input
                                                        type="date"
                                                        min={today}
                                                        className="pl-9"
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

                                            {/* COLOR */}

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
                                                        className="h-9 w-12 cursor-pointer p-1"
                                                    />

                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {product.color}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* DELETE */}

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
                                                            .length <=
                                                        1
                                                    }
                                                    title="Remove package"
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

                    {/* PRIORITY */}

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <RotateCw className="size-4" />

                        <span>Dispatch priority:</span>

                        <Badge variant="outline">
                            earliest due date
                        </Badge>

                        <span>→</span>

                        <Badge variant="outline">
                            highest invoice value
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* ===================================================== */}
            {/* TRUCK VIEWS */}
            {/* ===================================================== */}

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Maximize2 className="size-5 text-primary" />
                            Truck Spatial Comparison
                        </CardTitle>

                        <span className="text-sm text-muted-foreground">
                            All projections update simultaneously
                        </span>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <TruckView
                            title="Top View"
                            canvasRef={topCanvasRef}
                        />

                        <TruckView
                            title="Left Side View"
                            canvasRef={leftCanvasRef}
                        />

                        <TruckView
                            title="Right Side View"
                            canvasRef={rightCanvasRef}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ===================================================== */}
            {/* REJECTED PACKAGES */}
            {/* ===================================================== */}

            {state.packedBoxes.rejectedBoxes?.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription className="font-medium">
                        {state.packedBoxes.rejectedBoxes.length}{" "}
                        package(s) could not be loaded inside the
                        truck.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

/* ========================================================= */
/* TRUCK VIEW */
/* ========================================================= */

function TruckView({ title, canvasRef }) {
    return (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 border-b bg-background px-4 py-3 text-sm font-semibold">
                <Truck className="size-4" />
                {title}
            </div>

            <div className="relative h-[350px] w-full bg-muted/20">
                <canvas
                    ref={canvasRef}
                    className="block size-full"
                />
            </div>
        </div>
    );
}