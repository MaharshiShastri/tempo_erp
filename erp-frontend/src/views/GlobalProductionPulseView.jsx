import {FiActivity, FiArrowRight, FiBox, FiCalendar, FiClock, FiLayers,} from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GlobalProductionPulseView({ state }) {
    const {STAGES, orders, isLoading, isFactory, loadPulse, handleMoveStage, isDispatcher,} = state;

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <FiActivity className="size-6 animate-pulse text-primary" />

                        <span className="absolute inset-0 animate-ping rounded-full border border-primary/20" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Loading Factory Floor...
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Fetching the latest production movement.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const totalProducts = orders.reduce((total, order) => {
        return (
            total +
            (order.items && order.items.length > 0
                ? order.items.length
                : 1)
        );
    }, 0);

    const activeOrders = orders.length;

    return (
        <div className="mx-auto flex h-[85vh] w-full max-w-[1500px] flex-col gap-5">
            {/* ===================================================== */}
            {/* PRODUCTION PULSE HEADER */}
            {/* ===================================================== */}

            <Card className="relative shrink-0 overflow-hidden border-border/70 bg-gradient-to-r from-background via-background to-primary/[0.04] shadow-sm">
                {/* Decorative accent */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-blue-500 to-cyan-400" />

                <CardHeader className="pl-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        {/* TITLE */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FiActivity className="size-5" />
                                </div>

                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                >
                                    <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    LIVE FLOOR
                                </Badge>
                            </div>

                            <CardTitle className="text-xl font-bold tracking-tight">
                                Global Production Pulse
                            </CardTitle>

                            <CardDescription className="mt-1 max-w-2xl">
                                Company-wide transparency across active
                                production. Track products as they move
                                through the factory floor.
                            </CardDescription>
                        </div>

                        {/* SUMMARY METRICS */}
                        <div className="flex flex-wrap gap-2">
                            <PulseMetric
                                icon={<FiLayers />}
                                label="Orders"
                                value={activeOrders}
                                className="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            />

                            <PulseMetric
                                icon={<FiBox />}
                                label="Products"
                                value={totalProducts}
                                className="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            />

                            <PulseMetric
                                icon={<FiActivity />}
                                label="Stages"
                                value={STAGES.length}
                                className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* ===================================================== */}
            {/* KANBAN BOARD */}
            {/* ===================================================== */}

            <div className="min-h-0 flex-1 overflow-x-auto pb-2">
                <div className="flex h-full min-w-max gap-3.5">
                    {STAGES.map((stage, stageIndex) => {
                        const stageOrders = orders.filter(
                            (order) =>
                                order.production_stage === stage.key ||
                                (!order.production_stage &&
                                    stage.key === "PO_SUBMITTED")
                        );

                        const stageItems = stageOrders.flatMap((order) => {
                            const items =
                                order.items && order.items.length > 0
                                    ? order.items
                                    : [
                                          {
                                              item_code:
                                                  "Item details unavailable",
                                          },
                                      ];

                            return items.map((item, index) => ({
                                ...item,
                                _parentOrder: order,
                                _uniqueKey: `${order.order_id}-${index}`,
                            }));
                        });

                        return (
                            <ProductionStageColumn
                                key={stage.key}
                                stage={stage}
                                stageIndex={stageIndex}
                                stageItems={stageItems}
                                isFactory={isFactory}
                                handleMoveStage={handleMoveStage}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ========================================================= */
/* STAGE COLUMN */
/* ========================================================= */

function ProductionStageColumn({
    stage,
    stageIndex,
    stageItems,
    isFactory,
    handleMoveStage,
}) {
    return (
        <Card
            className="
                group
                flex
                h-full
                min-h-0
                w-[295px]
                shrink-0
                flex-col
                gap-0
                overflow-hidden
                border-border/60
                bg-muted/[0.18]
                py-0
                shadow-sm
                transition-all
                duration-200
                hover:shadow-md
                lg:flex-1
            "
        >
            {/* ================================================= */}
            {/* STAGE HEADER */}
            {/* ================================================= */}

            <div
                className="relative shrink-0 overflow-hidden px-4 py-3.5"
                style={{
                    background: `linear-gradient(
                        135deg,
                        ${stage.bg} 0%,
                        color-mix(in srgb, ${stage.bg} 55%, transparent) 55%,
                        transparent 100%
                    )`,
                    borderBottom: `3px solid ${stage.color}`,
                }}
            >
                {/* Background glow */}
                <div
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl"
                    style={{
                        backgroundColor: stage.color,
                    }}
                />

                <div className="relative flex items-center justify-between gap-3">
                    {/* Stage identity */}
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                            style={{
                                backgroundColor: stage.color,
                                boxShadow: `0 5px 15px ${stage.color}35`,
                            }}
                        >
                            <FiActivity className="size-4" />
                        </div>

                        <div className="min-w-0">
                            <div
                                className="truncate text-[13px] font-bold"
                                style={{
                                    color: stage.color,
                                }}
                            >
                                {stage.label}
                            </div>

                            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Stage {stageIndex + 1}
                            </div>
                        </div>
                    </div>

                    {/* Count */}
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                            color: stage.color,
                            backgroundColor: `${stage.color}18`,
                            border: `1px solid ${stage.color}35`,
                        }}
                    >
                        {stageItems.length}
                    </div>
                </div>
            </div>

            {/* ================================================= */}
            {/* STAGE BODY */}
            {/* ================================================= */}

            <ScrollArea className="min-h-0 flex-1">
                <div
                    className="flex min-h-full flex-col gap-2.5 p-2.5"
                    style={{
                        background: `linear-gradient(
                            180deg,
                            ${stage.color}08 0%,
                            transparent 180px
                        )`,
                    }}
                >
                    {stageItems.map((item) => (
                        <ProductionItemCard
                            key={item._uniqueKey}
                            item={item}
                            stage={stage}
                            isFactory={isFactory}
                            handleMoveStage={handleMoveStage}
                        />
                    ))}

                    {/* EMPTY STATE */}
                    {stageItems.length === 0 && (
                        <EmptyStage stage={stage} />
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}

/* ========================================================= */
/* PRODUCT CARD */
/* ========================================================= */

function ProductionItemCard({
    item,
    stage,
    isFactory,
    handleMoveStage,
}) {
    const order = item._parentOrder;

    const canAdvance =
        isFactory &&
        stage.key !== "DISPATCHED" &&
        stage.key !== "READY_TO_DISPATCH";

    return (
        <Card
            className="
                group/card
                relative
                overflow-hidden
                border-border/60
                bg-background
                py-0
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:shadow-md
            "
        >
            {/* Stage colour rail */}
            <div
                className="absolute inset-y-0 left-0 w-1"
                style={{
                    backgroundColor: stage.color,
                }}
            />

            <CardContent className="p-3 pl-4">
                {/* ================================================= */}
                {/* PRODUCT HEADER */}
                {/* ================================================= */}

                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex size-7 shrink-0 items-center justify-center rounded-md"
                                style={{
                                    backgroundColor: `${stage.color}12`,
                                    color: stage.color,
                                }}
                            >
                                <FiBox className="size-3.5" />
                            </div>

                            <span className="truncate text-sm font-bold text-foreground">
                                {item.item_code}
                            </span>
                        </div>
                    </div>

                    {/* QUANTITY */}
                    {item.quantity ? (
                        <Badge
                            variant="secondary"
                            className="shrink-0 border-0 bg-muted text-[10px] font-bold"
                        >
                            ×{item.quantity}
                        </Badge>
                    ) : null}
                </div>

                {/* ================================================= */}
                {/* INFORMATION */}
                {/* ================================================= */}

                <div className="mt-3 grid grid-cols-2 gap-2">
                    {/* OA */}
                    <InfoTile
                        icon={<FiLayers />}
                        label="Order"
                        value={order.order_id}
                        className="bg-blue-500/[0.07]"
                        iconClassName="text-blue-500"
                    />

                    {/* DUE DATE */}
                    <InfoTile
                        icon={<FiCalendar />}
                        label="Due"
                        value={order.due_date || "—"}
                        className="bg-rose-500/[0.07]"
                        iconClassName="text-rose-500"
                        valueClassName="text-rose-600 dark:text-rose-400"
                    />
                </div>

                {/* ================================================= */}
                {/* ACTION */}
                {/* ================================================= */}

                {canAdvance && (
                    <Button
                        type="button"
                        size="sm"
                        className="
                            mt-3
                            h-8
                            w-full
                            gap-1.5
                            border-0
                            text-[11px]
                            font-semibold
                            shadow-none
                            transition-all
                        "
                        style={{
                            backgroundColor: `${stage.color}12`,
                            color: stage.color,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                                stage.color;
                            e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                `${stage.color}12`;
                            e.currentTarget.style.color = stage.color;
                        }}
                        onClick={() =>
                            handleMoveStage(
                                order.order_id,
                                stage.key
                            )
                        }
                    >
                        Advance Stage

                        <FiArrowRight className="size-3.5 transition-transform group-hover/card:translate-x-0.5" />
                    </Button>
                )}

                {/* TERMINAL STATE */}
                {!canAdvance && isFactory && (
                    <div
                        className="mt-3 flex h-7 items-center justify-center rounded-md text-[10px] font-semibold"
                        style={{
                            color: stage.color,
                            backgroundColor: `${stage.color}0d`,
                        }}
                    >
                        <FiActivity className="mr-1.5 size-3" />
                        {stage.key === "DISPATCHED"
                            ? "Dispatched"
                            : "Ready for Dispatch"}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ========================================================= */
/* INFORMATION TILE */
/* ========================================================= */

function InfoTile({
    icon,
    label,
    value,
    className = "",
    iconClassName = "",
    valueClassName = "",
}) {
    return (
        <div
            className={`min-w-0 rounded-md border border-border/40 px-2 py-1.5 ${className}`}
        >
            <div className="flex items-center gap-1.5">
                <span className={`shrink-0 ${iconClassName}`}>
                    {icon}
                </span>

                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            </div>

            <div
                className={`mt-0.5 truncate font-mono text-[10px] font-semibold text-foreground ${valueClassName}`}
                title={String(value)}
            >
                {value}
            </div>
        </div>
    );
}

/* ========================================================= */
/* HEADER METRIC */
/* ========================================================= */

function PulseMetric({
    icon,
    label,
    value,
    className = "",
}) {
    return (
        <div
            className={`flex min-w-[90px] items-center gap-2 rounded-lg border border-border/50 px-3 py-2 ${className}`}
        >
            <div className="text-sm">
                {icon}
            </div>

            <div>
                <div className="text-base font-bold leading-none text-foreground">
                    {value}
                </div>

                <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                </div>
            </div>
        </div>
    );
}

/* ========================================================= */
/* EMPTY STAGE */
/* ========================================================= */

function EmptyStage({ stage }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div
                className="mb-3 flex size-11 items-center justify-center rounded-full"
                style={{
                    backgroundColor: `${stage.color}10`,
                    color: stage.color,
                }}
            >
                <FiBox className="size-5" />
            </div>

            <p
                className="text-xs font-semibold"
                style={{
                    color: stage.color,
                }}
            >
                No products here
            </p>

            <p className="mt-1 max-w-[180px] text-[10px] leading-relaxed text-muted-foreground">
                Products entering this stage will appear here
                automatically.
            </p>
        </div>
    );
}
