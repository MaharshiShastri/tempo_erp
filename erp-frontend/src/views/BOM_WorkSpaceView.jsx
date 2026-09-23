import {Plus, Trash, RefreshCw, Save, Package, AlertCircle, ArrowLeft} from "lucide-react";

import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableMultiSelect from "@/components/shared/SearchableMultiselect";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";

export default function BOM_WorkspaceView({state,}) {
    const {bom, updateBOM, addComponent, updateComponent, removeComponent, costRange, calculateCostRange, 
        isCalculating, saveBOM, refreshRawMaterials, rawItemMaster, itemsMaster, handleBackToBOMList} = state;

    const itemOptions = (rawItemMaster ?? []).map((item) => item.item_code).filter(Boolean);
    const productCodes = (itemsMaster ?? []).map((item) => item.item_code).filter(Boolean);
    
    return (
        <div className="mx-auto w-full max-w-[1400px]">
            <Card>
                <CardHeader className="flex flex-col gap-4 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="icon" onClick={handleBackToBOMList} title="Back to BOM Register" className="shrink-0">
                            <ArrowLeft className="h-4 w-4"/>
                        </Button>

                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-600" />
                                {state.bom?.id ? "Edit Bill of Materials" : "Create Bill of Materials"}
                            </CardTitle>

                            <CardDescription>
                                {state.bom?.id ? `Editing BOM ${state.bom.bom_name || state.bom.item_code}` :
                                "Define material requirements and calculate historical purchase-cost ranges."}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={calculateCostRange}
                            disabled={
                                isCalculating ||
                                bom?.components?.length === 0
                            }
                            className="gap-2"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    isCalculating
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />

                            {isCalculating
                                ? "Calculating..."
                                : "Calculate Cost"}
                        </Button>

                        <Button type="button" onClick={saveBOM} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4" />
                            Save BOM
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* BOM HEADER */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                BOM Details
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">

                                <div className="space-y-2">
                                    <Label>
                                        Finished Item Code
                                    </Label>

                                    <SearchableMultiSelect
                                    label=""
                                    options={productCodes}
                                    value={bom?.item_code ? [bom.item_code] : []}
                                    onChange={(values)=>updateBOM("item_code", values?.[0] || "")}
                                    single={true}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        BOM Name
                                    </Label>

                                    <Input
                                        value={
                                            bom?.bom_name
                                        }
                                        placeholder="Assembly BOM"
                                        onChange={(e) =>
                                            updateBOM(
                                                "bom_name",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Revision
                                    </Label>

                                    <Input
                                        type="number"
                                        min="1"
                                        value={
                                            bom?.revision_no
                                        }
                                        onChange={(e) =>
                                            updateBOM(
                                                "revision_no",
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Status
                                    </Label>

                                    <Select
                                        value={bom?.status}
                                        onValueChange={(value) =>
                                            updateBOM(
                                                "status",
                                                value
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Draft">
                                                Draft
                                            </SelectItem>

                                            <SelectItem value="Active">
                                                Active
                                            </SelectItem>

                                            <SelectItem value="Obsolete">
                                                Obsolete
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                        </CardContent>
                    </Card>


                    {/* OUTPUT */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Production Output
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">

                                <div className="space-y-2">
                                    <Label>
                                        Output Quantity
                                    </Label>

                                    <Input
                                        type="number"
                                        min="0.0001"
                                        step="0.0001"
                                        value={
                                            bom?.output_quantity
                                        }
                                        onChange={(e) =>
                                            updateBOM(
                                                "output_quantity",
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        UOM
                                    </Label>

                                    <Input
                                        value={bom?.uom}
                                        onChange={(e) =>
                                            updateBOM(
                                                "uom",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                            </div>
                        </CardContent>
                    </Card>


                    {/* COMPONENTS */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-base font-semibold">
                                Material Components
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Add raw materials, consumables
                                and sub-assemblies required for
                                one BOM output quantity.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addComponent}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />

                            Add Component
                        </Button>
                    </div>


                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[1100px] text-sm">

                            <thead className="bg-muted/50">
                                <tr className="border-b">

                                    <th className="px-3 py-3 text-left font-medium">
                                        #
                                    </th>

                                    <th className="px-3 py-3 text-left font-medium">
                                        Item Code
                                    </th>

                                    <th className="px-3 py-3 text-left font-medium">
                                        Quantity
                                    </th>

                                    <th className="px-3 py-3 text-left font-medium">
                                        UOM
                                    </th>

                                    <th className="px-3 py-3 text-left font-medium">
                                        Scrap %
                                    </th>

                                    <th className="bg-muted px-3 py-3 text-right font-medium">
                                        Min Rate
                                    </th>

                                    <th className="bg-muted px-3 py-3 text-right font-medium">
                                        Max Rate
                                    </th>

                                    <th className="bg-muted px-3 py-3 text-right font-medium">
                                        Min Cost
                                    </th>

                                    <th className="bg-muted px-3 py-3 text-right font-medium">
                                        Max Cost
                                    </th>

                                    <th className="w-12 px-3 py-3" />

                                </tr>
                            </thead>

                            <tbody>

                                {bom?.components.map(
                                    (component, index) => {

                                        const calculated =
                                            costRange?.components.find(
                                                (item) =>
                                                    item.item_code ===
                                                    component.item_code
                                            );

                                        return (
                                            <tr
                                                key={index}
                                                className="border-b last:border-0"
                                            >

                                                <td className="px-3 py-3 font-medium">
                                                    {index + 1}
                                                </td>

                                                <td className="p-3">
                                                    <SearchableMultiSelect
                                                    label=""
                                                    options={itemOptions}
                                                    value={component.item_code ? [component.item_code] : []}
                                                    onChange={(values) => updateComponent(index, "item_code", values?.[0] || "")}
                                                    single={true}
                                                    />

                                                    {calculated &&
                                                        !calculated.has_purchase_history && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                No purchase history
                                                            </div>
                                                        )}
                                                </td>

                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.0001"
                                                        value={
                                                            component.quantity
                                                        }
                                                        onChange={(e) =>
                                                            updateComponent(
                                                                index,
                                                                "quantity",
                                                                Number(
                                                                    e.target.value
                                                                )
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td className="p-3">
                                                    <Input
                                                        value={
                                                            component.uom
                                                        }
                                                        onChange={(e) =>
                                                            updateComponent(
                                                                index,
                                                                "uom",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            component.scrap_percent
                                                        }
                                                        onChange={(e) =>
                                                            updateComponent(
                                                                index,
                                                                "scrap_percent",
                                                                Number(
                                                                    e.target.value
                                                                )
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td className="bg-muted/50 px-3 py-3 text-right font-medium">
                                                    ₹
                                                    {(
                                                        calculated?.minimum_rate ||
                                                        0
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="bg-muted/50 px-3 py-3 text-right font-medium">
                                                    ₹
                                                    {(
                                                        calculated?.maximum_rate ||
                                                        0
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="bg-muted/50 px-3 py-3 text-right font-semibold">
                                                    ₹
                                                    {(
                                                        calculated?.minimum_cost ||
                                                        0
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="bg-muted/50 px-3 py-3 text-right font-semibold">
                                                    ₹
                                                    {(
                                                        calculated?.maximum_cost ||
                                                        0
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="p-3 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() =>
                                                            removeComponent(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>
                        </table>
                    </div>


                    {/* COST RANGE */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Material Cost Range
                            </CardTitle>

                            <CardDescription>
                                Historical purchase-price range
                                based on the cheapest and most
                                expensive batches for each component.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">

                                <div className="rounded-lg border p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Minimum Material Cost
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        ₹
                                        {(
                                            costRange?.minimum_material_cost ||
                                            0
                                        ).toLocaleString(
                                            "en-IN",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sum of cheapest historical
                                        component batches
                                    </p>
                                </div>

                                <div className="rounded-lg border p-5">
                                    <p className="text-sm text-muted-foreground">
                                        Maximum Material Cost
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        ₹
                                        {(
                                            costRange?.maximum_material_cost ||
                                            0
                                        ).toLocaleString(
                                            "en-IN",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sum of most expensive
                                        historical component batches
                                    </p>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                </CardContent>
            </Card>
        </div>
    );
}