import {
    CalendarDays,
    FileText,
    MapPin,
    Package,
    UserRound,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import OrderItemsTable from "./OrderItemsTable";

const STAGE_STYLES = {
    PO_SUBMITTED:
        "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",

    RAW_MATERIAL_ASSEMBLY:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",

    PRODUCTION_IN_PROGRESS:
        "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",

    READY_TO_DISPATCH:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    DISPATCHED:
        "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function formatStage(stage) {
    if (!stage) {
        return "Unknown";
    }

    return String(stage)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function OrderCard({ order, state }) {
    const stage = order.current_stage_code;
    const stageStyle =
        STAGE_STYLES[stage] ||
        "border-border bg-muted text-muted-foreground";

    const isReadyToDispatch =
        stage === "READY_TO_DISPATCH";

    return (
        <Card className="overflow-hidden border-border/70 shadow-sm">
            {/* ORDER HEADER */}
            <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    {/* ORDER ID / DATE */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className="font-mono text-xs"
                            >
                                {order.order_acceptance_id}
                            </Badge>

                            {stage && (
                                <Badge
                                    variant="outline"
                                    className={stageStyle}
                                >
                                    {formatStage(stage)}
                                </Badge>
                            )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />

                            <span>
                                Order Acceptance Date:{" "}
                                <span className="font-medium text-foreground">
                                    {order.order_acceptance_date ||
                                        "N/A"}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* ACTION */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {isReadyToDispatch ? (
                            <Button
                                type="button"
                                onClick={() =>
                                    state.triggerInvoiceSetupForOrder(
                                        order.order_acceptance_id
                                    )
                                }
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <FileText className="mr-2 size-4" />
                                Generate Commercial Invoice
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                                <span className="size-2 rounded-full bg-primary" />

                                <span className="text-muted-foreground">
                                    Current stage
                                </span>

                                <span className="font-medium">
                                    {formatStage(stage)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
                {/* ORDER INFORMATION */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoBlock
                        icon={UserRound}
                        label="Customer Code"
                        value={
                            order.tally_customer_code || "N/A"
                        }
                    />

                    <InfoBlock
                        icon={FileText}
                        label="PO Reference"
                        value={
                            order.purchase_order_number || "N/A"
                        }
                    />

                    <InfoBlock
                        icon={UserRound}
                        label="Billing Entity"
                        value={
                            order.billing_name || "N/A"
                        }
                    />

                    <InfoBlock
                        icon={MapPin}
                        label="Billing Address"
                        value={
                            order.billing_address || "N/A"
                        }
                    />
                </div>

                <Separator />

                {/* ITEMS */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Package className="size-4 text-primary" />

                        <h3 className="text-sm font-semibold">
                            Ordered Items
                        </h3>

                        <Badge
                            variant="secondary"
                            className="ml-auto"
                        >
                            {(order.items || []).length}{" "}
                            {(order.items || []).length === 1
                                ? "item"
                                : "items"}
                        </Badge>
                    </div>

                    <OrderItemsTable
                        items={order.items}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function InfoBlock({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="min-w-0 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-3.5 text-primary" />
                <span>{label}</span>
            </div>

            <p
                className="break-words text-sm font-medium"
                title={value}
            >
                {value}
            </p>
        </div>
    );
}